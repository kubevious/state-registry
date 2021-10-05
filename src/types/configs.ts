import { Alert } from "./alert";

export enum SnapshotConfigKind
{
    node = 'node',
    props = 'props',
    alerts = 'alerts',
    children = 'children'
} 

export interface SnapshotNodeConfig
{
    kind: string;
    rn: string;
    name?: string;
}

export interface SnapshotPropsConfig
{
    kind: string;
    id: string;
    title: string;
    order?: number;
    config: any;
}

export type SnapshotAlertsConfig = Alert[];

