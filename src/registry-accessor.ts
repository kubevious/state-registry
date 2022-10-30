import { NodeKind } from '@kubevious/entity-meta';
import { SnapshotNodeConfig, SnapshotPropsConfig  } from './types/configs';

export type ItemProperties = Record<string, SnapshotPropsConfig>;

export interface RegistryAccessor
{
    getNode(dn: string) : SnapshotNodeConfig | null;
    getProperties(dn: string) : ItemProperties;

    childrenByKind(parentDn: string, kind: NodeKind) : string[];
    scopeByKind(ancestorDn: string, kind: NodeKind) : string[];
}