import { SnapshotAlertsConfig, SnapshotConfigKind, SnapshotNodeConfig, SnapshotPropsConfig } from "./configs";

export interface SnapshotInfo
{
    date: Date;
    items: SnapshotItemInfo[];
}

export interface SnapshotItemInfo
{
    dn: string;
    kind: string;
    config_kind: SnapshotConfigKind;
    config: SnapshotNodeConfig | SnapshotPropsConfig | SnapshotAlertsConfig;
}