import axios from "axios";
import OpenAI from "openai";

const configuration = {
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY ?? '',
  dangerouslyAllowBrowser: true
};

const openai = new OpenAI(configuration);

const NftCode = `
use anchor_lang::prelude::*;
use std::collections::HashMap;

declare_id!("Fg6PaFpoGXkYsidMpWxqSWWPSY4uK6zK7d6CrP2Lo8");

#[program]
pub mod erc20 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, total_supply: u64) -> ProgramResult {
        let erc20 = &mut ctx.accounts.erc20;
        erc20.total_supply = total_supply;
        erc20.balances.insert(ctx.accounts.owner.key(), total_supply);
        emit!(Transfer {
            from: None,
            to: Some(*ctx.accounts.owner.key),
            value: total_supply,
        });
        Ok(())
    }

    pub fn transfer(ctx: Context<Transfer>, to: Pubkey, value: u64) -> ProgramResult {
        let erc20 = &mut ctx.accounts.erc20;
        let from = ctx.accounts.from.key();
        if let Some(balance) = erc20.balances.get_mut(from) {
            if *balance < value {
                return Err(ErrorCode::InsufficientBalance.into());
            }
            *balance -= value;
            let to_balance = erc20.balances.entry(to).or_insert(0);
            *to_balance += value;
            emit!(Transfer {
                from: Some(*from),
                to: Some(to),
                value,
            });
            Ok(())
        } else {
            Err(ErrorCode::InsufficientBalance.into())
        }
    }

    pub fn approve(ctx: Context<Approve>, spender: Pubkey, value: u64) -> ProgramResult {
        let erc20 = &mut ctx.accounts.erc20;
        let owner = ctx.accounts.owner.key();
        erc20.allowances.insert((owner, spender), value);
        emit!(Approval {
            owner: *owner,
            spender: spender,
            value,
        });
        Ok(())
    }

    pub fn transfer_from(ctx: Context<TransferFrom>, from: Pubkey, to: Pubkey, value: u64) -> ProgramResult {
        let erc20 = &mut ctx.accounts.erc20;
        let spender = ctx.accounts.spender.key();
        let allowance = erc20.allowances.get(&(from, *spender)).cloned().unwrap_or(0);
        if allowance < value {
            return Err(ErrorCode::InsufficientAllowance.into());
        }
        if let Some(balance) = erc20.balances.get_mut(&from) {
            if *balance < value {
                return Err(ErrorCode::InsufficientBalance.into());
            }
            *balance -= value;
            let to_balance = erc20.balances.entry(to).or_insert(0);
            *to_balance += value;
            erc20.allowances.insert((from, *spender), allowance - value);
            emit!(Transfer {
                from: Some(from),
                to: Some(to),
                value,
            });
            Ok(())
        } else {
            Err(ErrorCode::InsufficientBalance.into())
        }
    }
}

#[account]
pub struct Erc20 {
    pub total_supply: u64,
    pub balances: HashMap<Pubkey, u64>,
    pub allowances: HashMap<(Pubkey, Pubkey), u64>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = owner, space = 8 + 64 + (32 + 8) * 10)]
    pub erc20: ProgramAccount<'info, Erc20>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Transfer<'info> {
    #[account(mut)]
    pub from: Signer<'info>,
    #[account(mut)]
    pub erc20: ProgramAccount<'info, Erc20>,
}

#[derive(Accounts)]
pub struct Approve<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub erc20: ProgramAccount<'info, Erc20>,
}

#[derive(Accounts)]
pub struct TransferFrom<'info> {
    #[account(mut)]
    pub spender: Signer<'info>,
    #[account(mut)]
    pub erc20: ProgramAccount<'info, Erc20>,
}

#[event]
pub struct Transfer {
    pub from: Option<Pubkey>,
    pub to: Option<Pubkey>,
    pub value: u64,
}

#[event]
pub struct Approval {
    pub owner: Pubkey,
    pub spender: Pubkey,
    pub value: u64,
}

#[error]
pub enum ErrorCode {
    #[msg("Insufficient balance.")] 
    InsufficientBalance,
    #[msg("Insufficient allowance.")]
    InsufficientAllowance,
}

`

export const systemRecord = `Read the following psuedocode and write a ink smart contract for Substrate-based Blockchain using the ink framework.

Don't write things like Here's your contract, this that or anything other than the contract itself.

NEVER imagine any package like this github.com/nspcc-dev/neo-go/pkg/interop/storage. ONLY used the mentioned one in example if needed.

AVOID using golang or go or any text-block type of things in code.

Here's one example of smart contract for Neo Blockchain using neo-go library:

Storage Contract:
${NftCode}
`

export const writeFirstPseudoCode = async (purpose: string) => {
  const messages = [{
    'role': 'system',
    'content': `Create initial very simple psuedo writeup for the follwoing idea of smart contract in ink of substrate blockchain in basic english, by creating layout for different functions that will be required and conditions. And respond in:

      Don't overrite anything extra explaining that you wrote an answer. Just give exactly what asked.
    `
  }, {
    'role': 'user',
    'content': `I want to write a smart contract for ${purpose}.
      Don't go in full details, its just a draft. So share to me very basic and most important things and other details you can keep to yourself for future reference.
      Provide your response in this way:
      
      A json string like this:
      {
        name: // string name of the contract.
        response: // string holding the multi-line text of the psuedo writup plan.
      }`
  },]

  const chat_completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-1106",
    messages: messages as any,
    temperature: 1,

    response_format: { type: "json_object" },
  });

  console.log(chat_completion)
  const chat = chat_completion.choices[0]

  try {
    const d = JSON.parse(chat.message?.content ?? '{}');
    return d;
  } catch (e) {
    console.log(e)
  }
}

export const startNewContract = async (purpose: string, requirements: string) => {

  const messages = [{
    'role': 'system',
    'content': systemRecord
  }, {
    'role': 'user',
    'content': `here's the pseudo code ${requirements}, and write neo-go framework supported code.`
  }, {
    'role': 'user',
    'content': `I want to write a smart contract for ${purpose}. Your response should be just the contract itself, no explaination, titles or intro required. Make sure to not start response withh \`\`\`.`
  },]

  const chat_completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-1106",
    messages: messages as any,
    temperature: 1,
  });

  console.log("here, first time depth 2", messages)
  console.log(chat_completion)
  const chat = chat_completion.choices[0]

  try {
    const d = chat.message?.content ?? ''
    return d;
  } catch (e) {
    console.log(e)
  }
}


export const updateSmartContract = async (messages: any[]) => {
  const chat_completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-1106",
    messages: [...messages, {
      role: "user", content: `
      User can provide the same contract psuedo code but still you have to rethink on your approach. and write code.
      Update the smart contract by comparing the changes I did in psuedo code logics, don't change things that are not related to my updation,
      only reply with new contract. If nothing was changed in the pseudo code don't change anything. Dont write anything additinal for explaination.
    `}],
    temperature: 1,
    top_p: 1
  });

  console.log('c', chat_completion)
  const chat = chat_completion.choices[0]
  return chat.message?.content;
}

export const createConfigFile = async (contract: string) => {
  const chat_completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: }, {
      role: "user", content: `
        Write the configuration for the following smart contract code now:
        ${contract}
      `}],
    temperature: 1,
    max_tokens: 256,
    top_p: 1
  });

  console.log('c', chat_completion)
  const chat = chat_completion.choices[0]
  return chat.message?.content;
}
