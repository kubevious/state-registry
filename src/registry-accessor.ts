import { NodeKind, PropsId } from '@kubevious/entity-meta';
import { SnapshotNodeConfig, SnapshotPropsConfig  } from './types/configs';

export type ItemProperties = Record<string, SnapshotPropsConfig>;

export interface RegistryAccessor
{
    getNode(dn: string) : SnapshotNodeConfig | null;
    getAllProperties(dn: string) : ItemProperties;
    getProperties(dn: string, id: PropsId) : SnapshotPropsConfig;

    childrenByKind(parentDn: string, kind: NodeKind) : string[];
    scopeByKind(ancestorDn: string, kind: NodeKind) : string[];
}