import { CHAIN } from "./config";
import { ChainError, explainChainError } from "./errors";

interface RpcResponse {
  result?: { result?: number[]; error?: string; amount?: string };
  error?: { message?: string; data?: unknown; cause?: { name?: string } };
}

const toBase64 = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
};

async function rpc(params: object): Promise<RpcResponse> {
  let res: Response;
  try {
    res = await fetch(CHAIN.rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: "karcis", method: "query", params }),
    });
  } catch (e) {
    throw new ChainError(explainChainError(e));
  }
  if (!res.ok) throw new ChainError(`RPC NEAR membalas ${res.status}`);
  return (await res.json()) as RpcResponse;
}

/** Panggil fungsi view di kontrak. Mengembalikan hasil JSON (atau null). */
export async function viewCall<T>(method: string, args: object = {}, contract: string = CHAIN.contractId): Promise<T> {
  const json = await rpc({
    request_type: "call_function",
    finality: "optimistic",
    account_id: contract,
    method_name: method,
    args_base64: toBase64(JSON.stringify(args)),
  });
  if (json.error) throw new ChainError(explainChainError(json.error.data ?? json.error.message ?? "Error RPC"));
  if (json.result?.error) throw new ChainError(explainChainError(json.result.error));
  const bytes = json.result?.result;
  if (!bytes) throw new ChainError("Jawaban RPC kosong");
  const text = new TextDecoder().decode(new Uint8Array(bytes));
  return (text === "" ? null : JSON.parse(text)) as T;
}

/** Saldo NEAR (yoctoNEAR, string) sebuah akun; "0" jika akun belum ada */
export async function nearBalance(accountId: string): Promise<string> {
  const json = await rpc({ request_type: "view_account", finality: "optimistic", account_id: accountId });
  if (json.error) return "0";
  return json.result?.amount ?? "0";
}
