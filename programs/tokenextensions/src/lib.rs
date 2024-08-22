use anchor_lang::{prelude::*, Bump};
use anchor_spl::{associated_token::AssociatedToken, token::{self, Mint, Token, TokenAccount,FreezeAccount,Burn}};
declare_id!("Aj1GHyUXV6Vg5d5ipPEyPHTzmWvi52oByFaqnQ3bHEiT");

#[program]
pub mod tokenextensions {

    use anchor_lang::solana_program::stake::state::NEW_WARMUP_COOLDOWN_RATE;

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
    pub fn transfer_mint(ctx: Context<TransferMint>)->Result<()>{
        let cpi_context = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::MintTo{
                mint : ctx.accounts.spl_token_mint.to_account_info(),
                to : ctx.accounts.payer_mint_ata.to_account_info(),
                authority : ctx.accounts.payer.to_account_info()     
        });
        token::mint_to(cpi_context, 10)?;
        Ok(())
    }
    pub fn transfer_token_to_another(ctx: Context<TransferTokenToAnother>) -> Result<()>{
        let cpi_context = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer{
                from: ctx.accounts.payer_mint_ata.to_account_info(),
                to : ctx.accounts.another_account.to_account_info(),
                authority : ctx.accounts.payer.to_account_info()
            },
        );
        token::transfer(cpi_context, 1)?;
        Ok(())
    }
    pub fn freeze_token_account(ctx: Context<FreezeTokenAccount>)-> Result<()>{
        let cpi_contxt = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            FreezeAccount{
                account : ctx.accounts.payer_mint_ata.to_account_info(),
                mint : ctx.accounts.spl_token_mint.to_account_info(),
                authority : ctx.accounts.payer.to_account_info(),
            }
            );
            token::freeze_account(cpi_contxt)?;
            Ok(())
    }

    pub fn burn_token(ctx: Context<BurnToken>) -> Result<()>{
        let cpi_context = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn{
                from : ctx.accounts.payer_mint_ata.to_account_info(),
                mint : ctx.accounts.spl_token_mint.to_account_info(),
                authority : ctx.accounts.payer.to_account_info()
            }
        );
        token::burn(cpi_context, 1)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
#[derive(Accounts)]
pub struct BurnToken<'info>{
    #[account(mut, seeds = [b"spl-token-mint".as_ref()], bump = vault.spl_token_mint_bump)]
    pub spl_token_mint : Account<'info,Mint>,
    #[account(seeds = [b"vault"], bump = vault.bump)]
    pub vault : Account<'info,Vault>,
    #[account(mut)]
    pub payer : Signer<'info>,
    #[account(mut, associated_token::mint = spl_token_mint, associated_token::authority = payer)]
    pub payer_mint_ata : Box<Account<'info,TokenAccount>>,
    pub system_program : Program<'info,System>,
    pub token_program : Program<'info,Token>,
    pub rent : Sysvar<'info, Rent>,
    pub associated_token_program : Program<'info,AssociatedToken>
}
#[derive(Accounts)]
pub struct UnfreezeTokenAccount<'info>{
    #[account(mut, seeds = [b"spl-token-mint".as_ref()], bump = vault.spl_token_mint_bump)]
    pub spl_token_mint : Account<'info,Mint>,
    #[account(seeds = [b"vault".as_ref()], bump = vault.bump)]
    pub vault : Account<'info, Vault>,
    #[account(mut)]
    pub payer : Signer<'info>,
    #[account(mut, associated_token::mint = spl_token_mint, associated_token::authority = payer)]
    pub payer_mint_ata: Box<Account<'info,TokenAccount>>,
    pub system_program : Program<'info,System>,
    pub token_program : Program<'info, Token>,
    pub rent : Sysvar<'info,Rent>,
    pub associated_token_program : Program<'info, AssociatedToken>
}
#[derive(Accounts)]
pub struct FreezeTokenAccount<'info>{
    #[account(mut, seeds = [b"spl-token-mint".as_ref()], bump = vault.spl_token_mint_bump)]
    pub spl_token_mint : Account<'info,Mint>,
    #[account(seeds = [b"vault"], bump = vault.bump)]
    pub vault : Account<'info,Vault>,
    #[account(mut)]
    pub payer : Signer<'info>,
    #[account(mut, associated_token::mint = spl_token_mint, associated_token::authority = payer)]
    pub payer_mint_ata : Box<Account<'info,TokenAccount>>,
    pub system_program : Program<'info, System>,
    pub token_program : Program<'info,Token>,
    pub rent : Sysvar<'info, Rent>,
    pub associated_toekn_program : Program<'info,AssociatedToken> 
}
#[derive(Accounts)]
pub struct TransferTokenToAnother<'info>{
    #[account(
        seeds = [
           b"spl-token-mint".as_ref(),
        ],
       bump = vault.spl_token_mint_bump,
   )]
   pub spl_token_mint: Account<'info, Mint>, // ---> 1

   #[account(
       seeds = [
           b"vault"
       ],
       bump = vault.bump, // --> 2
   )]
   pub vault: Account<'info, Vault>,

   #[account(
       mut,
       associated_token::mint = spl_token_mint,
       associated_token::authority = payer
   )]
   pub payer_mint_ata: Box<Account<'info, TokenAccount>>, // --> 3

   #[account(mut)]
   pub payer: Signer<'info>, // ---> 4

   pub system_program: Program<'info, System>, // ---> 5
   pub token_program: Program<'info, Token>,   // ---> 6

   pub rent: Sysvar<'info, Rent>, // ---> 7

   pub associated_token_program: Program<'info, AssociatedToken>, // ---> 8

   #[account(
       init,
       payer = payer,
       associated_token::mint = spl_token_mint,
       associated_token::authority = another_account
   )]
   pub another_mint_ata: Box<Account<'info, TokenAccount>>, // --> 9

   /// CHECK : We just pass the account info for the demonstration purpose. Ideally this is either signer or trusted account
   pub another_account: AccountInfo<'info>, // ---> 10
}
#[derive(Accounts)]
pub struct CreatMint<'info>{
    #[account(init, seeds = [b"spl-token-mint".as_ref(),], bump, payer = payer,mint::authority = payer, mint::decimals = 0, mint::freeze_authority = payer)]
    pub spl_token_mint: Account<'info,Mint>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent:Sysvar<'info, Rent>,
    #[account(init, space = 8 + Vault::LEN , seeds = [b"valut"], bump, payer = payer)]
    pub vault : Account<'info, Vault>
}

#[derive(Accounts)]
pub struct TransferMint<'info>{
    #[account(mut, seeds = [b"spl-toekn_mint".as_ref()],bump = vault.spl_token_mint_bump)]
    pub spl_token_mint : Account<'info,Mint>,
    #[account(seeds = [b"vault"], bump = vault.bump)]
    pub vault : Account<'info, Vault>,
    #[account(init, payer = payer, associated_token::mint = spl_token_mint, associated_token::authority = payer)]
    pub payer_mint_ata : Box<Account<'info,TokenAccount>>,
    #[account(mut)]
    pub payer : Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info,Token>,
    pub rent: Sysvar<'info,Rent>,
    pub associated_token_program: Program<'info,AssociatedToken>
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

