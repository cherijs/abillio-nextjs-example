import axios from 'axios';
import { Base64 } from 'js-base64';
import crypto from 'crypto';

const API_URL = process.env.ABILLIO_API_URL || 'https://api-staging.abill.io';
const API_KEY = process.env.ABILLIO_API_KEY!;
const API_SECRET = process.env.ABILLIO_API_SECRET!;

function encodeHmac(key: string, msg: string) {
  return crypto.createHmac('sha256', key).update(msg).digest('hex');
}

export async function abillioApiRequest<T = unknown, P = Record<string, unknown>>(
  endpoint: string,
  payload: P = {} as P,
  method: 'GET' | 'POST' = 'GET',
  params: Record<string, unknown> = {},
): Promise<T> {
  const request_path = `/v1/${endpoint}/`;
  const fullPayload = { ...payload, request: request_path, nonce: Date.now() };
  const encoded_payload = JSON.stringify(fullPayload);
  const b64 = Base64.encode(encoded_payload);
  const signature = encodeHmac(API_SECRET, b64);

  const request_headers = {
    'X-ABILLIO-KEY': API_KEY,
    'X-ABILLIO-PAYLOAD': b64,
    'X-ABILLIO-SIGNATURE': signature,
  };

  const response = await axios({
    method,
    url: API_URL + request_path,
    headers: request_headers,
    params,
  });
  console.log(API_URL + request_path);
  console.log(params);
  return response.data;
}
