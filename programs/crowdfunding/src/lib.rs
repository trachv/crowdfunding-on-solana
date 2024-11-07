use anchor_lang::prelude::*;

declare_id!("GQvtH9oJoWXwr5Q9WrbVAipYqfJb2JiLjB6iKYurynEr");

const MAX_TITLE_LENGTH: usize = 100;
const MAX_DESCRIPTION_LENGTH: usize = 500;
const MIN_CAMPAIGN_DURATION: i64 = 3600;
const MAX_CAMPAIGN_DURATION: i64 = 86400 * 30;

#[program]
pub mod crowdfunding {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let admin = &mut ctx.accounts.admin;
        admin.authority = *ctx.accounts.authority.key;
        admin.paused = false;
        Ok(())
    }

    pub fn create_campaign(
        ctx: Context<CreateCampaign>,
        title: String,
        description: String,
        goal: u64,
        deadline: i64,
    ) -> Result<()> {
        let admin = &ctx.accounts.admin;
        require!(!admin.paused, ErrorCode::ContractPaused);

        let clock = Clock::get()?;
        let duration = deadline - clock.unix_timestamp;

        require!(duration >= MIN_CAMPAIGN_DURATION, ErrorCode::CampaignTooShort);
        require!(duration <= MAX_CAMPAIGN_DURATION, ErrorCode::CampaignTooLong);
        require!(title.len() <= MAX_TITLE_LENGTH, ErrorCode::TitleTooLong);
        require!(description.len() <= MAX_DESCRIPTION_LENGTH, ErrorCode::DescriptionTooLong);

        let campaign = &mut ctx.accounts.campaign;
        campaign.creator = *ctx.accounts.creator.key;
        campaign.title = title;
        campaign.description = description;
        campaign.goal = goal;
        campaign.raised_amount = 0;
        campaign.deadline = deadline;
        Ok(())
    }

    pub fn donate(ctx: Context<Donate>, amount: u64) -> Result<()> {
    let admin = &ctx.accounts.admin;
    require!(!admin.paused, ErrorCode::ContractPaused);

    let clock = Clock::get()?;

    require!(
        clock.unix_timestamp < ctx.accounts.campaign.deadline,
        ErrorCode::CampaignEnded
    );

    let transfer_ix = anchor_lang::system_program::Transfer {
        from: ctx.accounts.donor.to_account_info(),
        to: ctx.accounts.campaign.to_account_info(),
    };
    let transfer_ctx =
        CpiContext::new(ctx.accounts.system_program.to_account_info(), transfer_ix);
    anchor_lang::system_program::transfer(transfer_ctx, amount)?;

    let campaign = &mut ctx.accounts.campaign;

    campaign.raised_amount = campaign
        .raised_amount
        .checked_add(amount)
        .ok_or(ErrorCode::MathOverflow)?;

    Ok(())
}

    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        let admin = &ctx.accounts.admin;
        require!(!admin.paused, ErrorCode::ContractPaused);

        let campaign = &mut ctx.accounts.campaign;
        let clock = Clock::get()?;

        require!(
            clock.unix_timestamp > campaign.deadline,
            ErrorCode::CampaignNotEnded
        );
        require!(
            campaign.raised_amount >= campaign.goal,
            ErrorCode::GoalNotReached
        );
        require!(
            campaign.creator == *ctx.accounts.creator.key,
            ErrorCode::Unauthorized
        );

        let total_lamports = ctx
            .accounts
            .creator
            .to_account_info()
            .lamports()
            .checked_add(ctx.accounts.campaign.to_account_info().lamports())
            .ok_or(ErrorCode::MathOverflow)?;

        **ctx
            .accounts
            .creator
            .to_account_info()
            .try_borrow_mut_lamports()? = total_lamports;
        **ctx
            .accounts
            .campaign
            .to_account_info()
            .try_borrow_mut_lamports()? = 0;

        Ok(())
    }

    pub fn toggle_pause(ctx: Context<TogglePause>) -> Result<()> {
        let admin = &mut ctx.accounts.admin;
        require!(
            admin.authority == *ctx.accounts.authority.key,
            ErrorCode::Unauthorized
        );
        admin.paused = !admin.paused;
        Ok(())
    }
}

#[account]
pub struct Campaign {
    pub creator: Pubkey,
    pub title: String,
    pub description: String,
    pub goal: u64,
    pub raised_amount: u64,
    pub deadline: i64,
}

#[account]
pub struct Admin {
    pub authority: Pubkey,
    pub paused: bool,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 1,
        seeds = [b"admin"],
        bump,
    )]
    pub admin: Account<'info, Admin>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(title: String, description: String)]
pub struct CreateCampaign<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Campaign::max_size(),
    )]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(mut, seeds = [b"admin"], bump)]
    pub admin: Account<'info, Admin>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Donate<'info> {
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub donor: Signer<'info>,
    #[account(mut, seeds = [b"admin"], bump)]
    pub admin: Account<'info, Admin>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut, has_one = creator)]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(mut, seeds = [b"admin"], bump)]
    pub admin: Account<'info, Admin>,
}

#[derive(Accounts)]
pub struct TogglePause<'info> {
    #[account(mut, seeds = [b"admin"], bump)]
    pub admin: Account<'info, Admin>,
    pub authority: Signer<'info>,
}

impl Campaign {
    pub fn max_size() -> usize {
        8 + 
        32 + // creator: Pubkey
        4 + MAX_TITLE_LENGTH + // title: String
        4 + MAX_DESCRIPTION_LENGTH + // description: String
        8 + // goal: u64
        8 + // raised_amount: u64
        8 // deadline: i64
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("The campaign has ended.")]
    CampaignEnded,
    #[msg("The campaign has not ended yet.")]
    CampaignNotEnded,
    #[msg("The goal has not been reached.")]
    GoalNotReached,
    #[msg("Unauthorized.")]
    Unauthorized,
    #[msg("Math overflow.")]
    MathOverflow,
    #[msg("The campaign name is too long.")]
    TitleTooLong,
    #[msg("The campaign description is too long.")]
    DescriptionTooLong,
    #[msg("The campaign duration is too short.")]
    CampaignTooShort,
    #[msg("The campaign duration is too long.")]
    CampaignTooLong,
    #[msg("The contract is paused.")]
    ContractPaused,
}
