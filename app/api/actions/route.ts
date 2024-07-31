import {ActionPostResponse, ACTIONS_CORS_HEADERS, createPostResponse, ActionGetResponse, ActionPostRequest} from "@solana/actions";
import {clusterApiUrl,Connection, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmRawTransaction, SystemProgram, Transaction} from "@solana/web3.js";
import { DEFAULT_SOL_ADDRESS, DEFAULT_SOL_AMOUNT } from "./const";


export const GET  = async (req: Request) => {
    try{    
        const requestUrl = new URL(req.url);
        const { toPubkey } = validatedQueryParams(requestUrl);

        const baseHref = new URL(
            `/api/actions/?to=${toPubkey.toBase58()}`,
            requestUrl.origin
        ).toString();

        const payload: ActionGetResponse = {
            title: "test",
            icon: "https://static.wikia.nocookie.net/beluga/images/d/d0/Crying_Cat.jpg/revision/latest?cb=20231218160953",
            description:"test",
            label:"Donate",
            links:{
                actions:[
                    {
                        label: "Send SOL", // button text
                        href: `${baseHref}&amount={amount}`, // this href will have a text input
                        parameters: [
                            {
                                name: "amount", // parameter name in the `href` above
                                label: "Enter the amount of SOL to send", // placeholder of the text input
                                required: true
                            }
                        ]
                    }
                ]
            }
            
        }
        return Response.json(payload, {
            headers: ACTIONS_CORS_HEADERS,
        });
    } catch (err) {
        console.log(err);
        let message = "An unknown error occurred";
        if (typeof err == "string") message = err;
        return new Response(message, {
            status: 400,
            headers: ACTIONS_CORS_HEADERS,
        });
    }
}


  // DO NOT FORGET TO INCLUDE THE `OPTIONS` HTTP METHOD
  // THIS WILL ENSURE CORS WORKS FOR BLINKS
export const OPTIONS = async (req: Request) => {
    return new Response(null, { headers: ACTIONS_CORS_HEADERS });
};

export const POST = async (req: Request) => {
    try {
    const requestUrl = new URL(req.url);
    const { amount, toPubkey } = validatedQueryParams(requestUrl);

    const body: ActionPostRequest = await req.json();

      // validate the client provided input
    let account: PublicKey;
    try {
        account = new PublicKey(body.account);
    } catch (err) {
        return new Response('Invalid "account" provided', {
            status: 400,
            headers: ACTIONS_CORS_HEADERS,
        });
    }

    const connection = new Connection(
        process.env.SOLANA_RPC! || clusterApiUrl("devnet")
    );

    // Create a test transaction to calculate fees
    let transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: account,
            toPubkey: DEFAULT_SOL_ADDRESS,
            lamports: amount,
        })
    );

    const { blockhash } = await connection.getLatestBlockhash('confirmed');
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = account;

    // Calculate exact fee rate to transfer entire SOL amount out of account minus fees
    const fee = (await connection.getFeeForMessage(transaction.compileMessage(), 'confirmed')).value || 0;

     // Remove our transfer instruction to replace it
    transaction.instructions.pop();

     // Now add the instruction back with correct amount of lamports
    transaction.add(
        SystemProgram.transfer({
            fromPubkey: account,
            toPubkey: DEFAULT_SOL_ADDRESS,
            lamports: amount - fee,
        })
    );


    // const transferSolInstruction = SystemProgram.transfer({
    //     fromPubkey: account,
    //     toPubkey: toPubkey,
    //     lamports: amount * LAMPORTS_PER_SOL,
    // });

    // const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

    // const transaction = new Transaction({
    //     feePayer: account,
    //     blockhash,
    //     lastValidBlockHeight,
    // }).add(transferSolInstruction);

    // Calculate exact fee rate to transfer entire SOL amount out of account minus fees
    const payload: ActionPostResponse = await createPostResponse({
        fields: {
            transaction,
            message: `Send ${amount} SOL to ${toPubkey.toBase58()}`,
        },
        // note: no additional signers are needed
        // signers: [],
    });

    return new Response(JSON.stringify(payload), {
        headers: ACTIONS_CORS_HEADERS,
    });

    } catch (err) {
    console.error(err);
    const message = typeof err === "string" ? err : "An unknown error occurred";
    return new Response(message, {
        status: 400,
        headers: ACTIONS_CORS_HEADERS,
    });
    }
};




function validatedQueryParams(requestUrl: URL) {
    let toPubkey: PublicKey = DEFAULT_SOL_ADDRESS;
    let amount: number = DEFAULT_SOL_AMOUNT;

    try {
        if (requestUrl.searchParams.get("to")) {
            toPubkey = new PublicKey(requestUrl.searchParams.get("to")!);
        }
    } catch (err) {
        throw "Invalid input query parameter: to";
    }

    try {
        if (requestUrl.searchParams.get("amount")) {
            amount = parseFloat(requestUrl.searchParams.get("amount")!);
        }
        if (amount <= 0) throw "amount is too small";
    } catch (err) {
        throw "Invalid input query parameter: amount";
    }

    return {
        amount,
        toPubkey,
    };
}