use anchor_lang::{prelude::*, solana_program::rent};
use anchor_spl::token::{Mint, Token};
declare_id!("Aj1GHyUXV6Vg5d5ipPEyPHTzmWvi52oByFaqnQ3bHEiT");

#[program]
pub mod tokenextensions {
    use anchor_spl::associated_token::Create;

    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn create_mint(ctx: Context<CreatMint>) -> Result<()>{
        let vault = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.payer.key();
        vault.spl_token_mint_bump = ctx.bumps.spl_token_mint;
        vault.bump = ctx.bumps.vault;
        vault.spl_token_mint = ctx.accounts.spl_token_mint.key();
        Ok(()) 
    }
}

#[derive(Accounts)]
pub struct Initialize {}
#[derive(Accounts)]
pub struct CreatMint<'info>{
    #[account(init, seeds = [b"spl-token-mint".as_ref(),], bump, payer = payer,mint::authority = payer, mint::decimals = 0,mint::freeze_authority = payer)]
    pub spl_token_mint: Account<'info,Mint>,
    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent:Sysvar<'info, Rent>,
    #[account(init, space = 8 + Vault::LEN , seeds = [b"valut"], bump, payer = payer)]
    pub vault : Account<'info, Vault>
}
#[account]
pub struct Vault{
    bump : u8,
    spl_token_mint_bump : u8,
    authority : Pubkey,
    spl_token_mint : Pubkey
}

impl Vault {
    pub const LEN : usize = 1 + 1 + 32 + 32;
}