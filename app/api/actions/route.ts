import { ActionGetResponse, ActionPostRequest, ActionPostResponse, ACTIONS_CORS_HEADERS } from '@solana/actions';
import { PublicKey, SystemProgram, Transaction, Connection, clusterApiUrl } from '@solana/web3.js';

export async function GET(request: Request) {
    try {
        const payload: ActionGetResponse = {
            icon: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTLT7i1KaPG3JWvgdPnWK9h3h3IxUxumVQsEA&s",
            description: "Hi, I'm Marc Anthony M. San Juan, a dedicated student from the Philippines. I am passionate about blockchain technology and its potential to revolutionize various industries. I am currently seeking funds to attend Solana Breakpoint 2024, a premier event that will allow me to gain invaluable insights, network with industry leaders, and further my education and involvement in the blockchain space. In the Philippines, ''limos'' is a term that means alms, symbolizing a plea for help. As a determined student, I am reaching out for your support to make this opportunity a reality. Attending Solana Breakpoint 2024 is a pivotal step in my journey, and with your help, I can achieve my goals and contribute significantly to the blockchain community. Your generous support will not only help me attend this event but also empower me to bring back knowledge and innovation to the Philippines, fostering growth and development in our local blockchain ecosystem.",
            title: "Blink Limos for Solana Breakpoint 2024",
            label: 'Donate'
        };
        return new Response(JSON.stringify(payload), { headers: ACTIONS_CORS_HEADERS });
    } catch (err) {
        console.error(err);
        const message = typeof err === "string" ? err : "An unknown error occurred";
        return new Response(message, {
            status: 400,
            headers: ACTIONS_CORS_HEADERS,
        });
    }
};

export async function POST(request: Request) {
    try {
        const connection = new Connection(clusterApiUrl('mainnet-beta'));
        const requestBody: ActionPostRequest = await request.json();
        const userPubkey = new PublicKey(requestBody.account);
        console.log(userPubkey.toString());

        const tx = new Transaction();
        const ix = SystemProgram.transfer({
            fromPubkey: userPubkey,
            toPubkey: new PublicKey("41ywsxNiW27shHcaHJ5fLc2KbMaoqMoSWkDNnzS9Fgzm"),
            lamports: 1000000
        });
        tx.add(ix);

        const { blockhash } = await connection.getLatestBlockhash({ commitment: "finalized" });
        console.log("using blockhash " + blockhash);

        tx.feePayer = userPubkey;
        tx.recentBlockhash = blockhash;

        const serialTX = tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString("base64");

        const response: ActionPostResponse = {
            transaction: serialTX,
            message: `hello ${userPubkey.toString()}. This will help Me-Aw so much. Thank you very much.🤙🏿🤙🏿🤙🏿`,
        };

        return new Response(JSON.stringify(response), { headers: ACTIONS_CORS_HEADERS });
    } catch (err) {
        console.error(err);
        const message = typeof err === "string" ? err : "An unknown error occurred";
        return new Response(message, {
            status: 400,
            headers: ACTIONS_CORS_HEADERS,
        });
    }
};

// export async function OPTION(request: Request){
//     return new Response(null, {headers: ACTIONS_CORS_HEADERS,});
// }