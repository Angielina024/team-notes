export const DEFAULT_TIMEOUT_MS = 8_000;

export interface FetchJsonOptions extends Omit<RequestInit, 'body'> {
    body?: unknown;
    timeoutMs?: number;
}

export class HttpError extends Error {
    readonly status: number;
    readonly statusText: string;
    readonly url: string; 
    readonly body: unknown;

    constructor(init: {status: number, statusText: string, url: string; body: unknown}) {
        super(`HTTP ${init.status} ${init.statusText} (${init.url}`);
        this.name = 'HTTPError';
        this.status = init.status;
        this.statusText = init.statusText;
        this.url = init.url;
        this.body = init.body;
    }
}

async function readBody(response: Response): Promise<unknown> {
    const text = await response.text();
    if (text === '') return null;
    try {
        return JSON.parse(text) as unknown;
    } catch (error) {
        return text;
    }
}

export async function fetchJson<T = unknown>(url: string, options: FetchJsonOptions = {}): Promise<T> {
    const { body, timeoutMs = DEFAULT_TIMEOUT_MS, signal, headers, ...init } = options; 

    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const combinedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

    const requestHeaders = new Headers(headers);
    requestHeaders.set('Accept', 'application/json');
    if(body !== undefined) {requestHeaders.set('Content-Type', 'application/json')};

    const response = await fetch(url, {...init, headers: requestHeaders, signal: combinedSignal, body: body !== undefined ? JSON.stringify(body) : undefined})
    const payload = await readBody(response);

    if(!response.ok) {
        throw new HttpError({status: response.status, statusText: response.statusText, url: response.url || url, body: payload});
    } 
        return payload as T;
}

export function isAbortError(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'AbortError';
}

export function isTimeoutError(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'TimeoutError';
}

export async function mapWithConcurrency<T, R> (items: readonly T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]>{
    if(!Number.isInteger(limit) || limit < 1) {
        throw new RangeError(`limit має бути цілим числом ≥ 1, отримано ${limit}`);
    }

    const results = new Array<R>(items.length);
    const queue = items.entries();
    let failed = false;

    async function worker(): Promise<void> {
        for (const [index, item] of queue) {
            if (failed) return;
            try {
                results[index] = await fn(item, index);
            } catch (error) {
                failed = true;
                throw error;
            }
        }
    }

        const workerCount = Math.min(limit, items.length);
        await Promise.all(Array.from({length: workerCount}, () => worker()));
        return results;
}