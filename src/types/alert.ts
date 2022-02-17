
export interface AlertCounter {
    error: number,
    warn: number
}

export enum AlertSourceKind {
    validator = 'validator',
    rule = 'rule',
}

export interface AlertValidatorSource
{
    kind: AlertSourceKind.validator;
    id: string;
}

export interface AlertRuleSource
{
    kind: AlertSourceKind.rule;
    id: string;
}

export type AlertSource = 
{
    kind?: AlertSourceKind;
} | (AlertValidatorSource | AlertRuleSource);

export interface Alert
{
    id: string,
    severity: string,
    msg: string,
    source?: AlertSource
}