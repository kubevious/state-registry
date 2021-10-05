
export interface AlertCounter {
    error: number,
    warn: number
}

export interface Alert
{
    id: string,
    severity: string,
    msg: string,
    source?: any
}