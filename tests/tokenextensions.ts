import * as anchor from "@coral-xyz/anchor";
import { Program, Provider } from "@coral-xyz/anchor";
import { Tokenextensions } from "../target/types/tokenextensions";
import { publicKey } from "@coral-xyz/anchor/dist/cjs/utils";
import { PublicKey, SystemProgram } from '@solana/web3.js'
import { ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { ASSOCIATED_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import idl from "../target/idl/tokenextensions.json"
import { assert } from "chai";

describe("tokenextensions", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();
  const program = anchor.workspace.Tokenextensions as Program<Tokenextensions>;
  const anotherWallet = anchor.web3.Keypair.generate();
  const findAssociatedTokenAccountAddress = async (payerKey: PublicKey, mintkey: PublicKey) => {
    return PublicKey.findProgramAddressSync(
      [
        payerKey.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        mintkey.toBuffer()
      ],
      ASSOCIATED_PROGRAM_ID
    )
  }
  const findSplTokenMintAddress = async () => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("spl-token-mint")],
      new PublicKey(idl.metadata.address)
    );
  }
  const findVaultAddress = async () => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("vault")],
      new PublicKey(idl.metadata.address)
    );
  }
  const addSols = async (
    provider: Provider,
    wallet: anchor.web3.PublicKey,
    amount = 1 * anchor.web3.LAMPORTS_PER_SOL
  ) => {
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(wallet, amount),
      "confirmed"
    );
  };

  const payer = anchor.web3.Keypair.generate();

  before("Add sols to wallet ", async () => {
    await addSols(provider, payer.publicKey, 2); // add some sols before calling test cases
    await addSols(provider, anotherWallet.publicKey, 2);
  });

  it("Spl token is initialized!", async () => {
    const [splTokenMint, _1] = await findSplTokenMintAddress();
    console.log("spltokennmint", splTokenMint);
    const [vaultMint, _2] = await findVaultAddress();
    console.log("vault", vaultMint);
    const tx = await program.methods
      .createMint()
      .accounts({
        splTokenMint: splTokenMint,
        vault: vaultMint,
        payer: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([payer])
      .rpc();

    const vaultData = await program.account.vault.fetch(vaultMint);

    assert(
      vaultData.splTokenMint.toString() === splTokenMint.toString(),
      "The spl token mint should be same"
    );

    console.log("Your transaction signature", tx);
  });
  it("should mint the spl-token-mint to payer_mint_ata", async () => {
    const [splTokenMint, _1] = await findSplTokenMintAddress();

    const [vaultMint, _2] = await findVaultAddress();

    const [payerMintAta, _3] = await findAssociatedTokenAccountAddress(
      payer.publicKey,
      splTokenMint
    );

    const tx = await program.methods
      .transferMint()
      .accounts({
        splTokenMint: splTokenMint,
        vault: vaultMint,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        payerMintAta: payerMintAta,
        payer: payer.publicKey,
      })
      .signers([payer])
      .rpc();

    console.log("Your transaction signature", tx);
  });
  it("should transfer 1 token from payer_mint_ata to another_mint_ata", async () => {
    try {
      const [splTokenMint, _1] = await findSplTokenMintAddress();
  
      const [vaultMint, _2] = await findVaultAddress();
  
      const [payerMintAta, _3] = await findAssociatedTokenAccountAddress(
        payer.publicKey,
        splTokenMint
      );
  
      const [anotherMintAta, _4] = await findAssociatedTokenAccountAddress(
        anotherWallet.publicKey,
        splTokenMint
      );
  
      const tx = await program.methods
        .transferTokenToAnother()
        .accounts({
          splTokenMint: splTokenMint,
          vault: vaultMint,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          payerMintAta: payerMintAta,
          payer: payer.publicKey,
          anotherMintAta: anotherMintAta,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          anotherAccount: anotherWallet.publicKey,
        })
        .signers([payer])
        .rpc();
  
      console.log("Your transaction signature", tx);
    } catch (err) {
      console.log(err);
    }
  });
  it("should freeze token account of payer wallet ", async () => {
    try {
      const [splTokenMint, _1] = await findSplTokenMintAddress();

      const [vaultMint, _2] = await findVaultAddress();

      const [payerMintAta, _3] = await findAssociatedTokenAccountAddress(
        payer.publicKey,
        splTokenMint
      );

      const tx = await program.methods
        .freezeTokenAccount()
        .accounts({
          splTokenMint: splTokenMint,
          vault: vaultMint,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          payerMintAta: payerMintAta,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          payer: payer.publicKey,
        })
        .signers([payer])
        .rpc();

      console.log("Your transaction signature", tx);
    } catch (err) {
      console.log(err);
    }
  });
  it("should unfreeze token account of payer wallet ", async () => {
    try {
      const [splTokenMint, _1] = await findSplTokenMintAddress();

      const [vaultMint, _2] = await findVaultAddress();

      const [payerMintAta, _3] = await findAssociatedTokenAccountAddress(
        payer.publicKey,
        splTokenMint
      );

      const tx = await program.methods
        .unfreezeTokenAccount()
        .accounts({
          splTokenMint: splTokenMint,
          vault: vaultMint,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          payerMintAta: payerMintAta,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          payer: payer.publicKey,
        })
        .signers([payer])
        .rpc();

      console.log("Your transaction signature", tx);
    } catch (err) {
      console.log(err);
    }
  });
  it("should burn a token of payer wallet ", async () => {
    try {
      const [splTokenMint, _1] = await findSplTokenMintAddress();

      const [vaultMint, _2] = await findVaultAddress();

      const [payerMintAta, _3] = await findAssociatedTokenAccountAddress(
        payer.publicKey,
        splTokenMint
      );

      const tx = await program.methods
        .burnToken()
        .accounts({
          splTokenMint: splTokenMint,
          vault: vaultMint,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          payerMintAta: payerMintAta,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          payer: payer.publicKey,
        })
        .signers([payer])
        .rpc();

      console.log("Your transaction signature", tx);
    } catch (err) {
      console.log(err);
    }
  });

});

