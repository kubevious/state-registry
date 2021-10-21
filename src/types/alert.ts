
export interface AlertCounter {
    error: number,
    warn: number
}

export enum AlertSourceKind {
    parser = 'parser',
    rule = 'rule',
}

export interface AlertSource
{
    kind?: AlertSourceKind;
    id?: string;
}
export interface Alert
{
    id: string,
    severity: string,
    msg: string,
    source?: AlertSource
}

