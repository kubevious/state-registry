import _ from 'the-lodash';
import { ILogger } from 'the-logger';

import { NodeKind, PropsId } from '@kubevious/entity-meta';
import { EnumDictionary } from '@kubevious/entity-meta';
import { parentDn, sanitizeDnPath } from '@kubevious/entity-meta';

import { RegistryStateNode } from './registry-state-node';
import { RegistryBundleState } from './registry-bundle-state';import { Alert } from './types/alert';
import { SnapshotAlertsConfig, SnapshotConfigKind, SnapshotNodeConfig, SnapshotPropsConfig  } from './types/configs';
import { SnapshotInfo, SnapshotItemInfo } from './types/snapshot';

import { RegistryAccessor, ItemProperties } from './registry-accessor';

export class RegistryState implements RegistryAccessor
{
    private _date : Date;

    private _nodeMap : Record<string, RegistryStateNode> = {};
    private _childrenMap : Record<string, string[]> = {};
    private _propertiesMap : Record<string, ItemProperties> = {};
    private _alertsMap : Record<string, Alert[]> = {};
    private _kindMap : EnumDictionary<NodeKind, Record<string, RegistryStateNode>> = {};

    private _stateBundle? : RegistryBundleState;

    constructor(snapshotInfo: SnapshotInfo)
    {
        if (!snapshotInfo.date) {
            this._date = new Date();
        } else {
            if (_.isString(snapshotInfo.date)) {
                this._date = new Date(snapshotInfo.date)
            } else {
                this._date = snapshotInfo.date;
            }
        }

        this._transform(snapshotInfo);
    }

    get date() : Date
    {
        return this._date;
    }

    getCount() : number
    {
        return _.keys(this._nodeMap).length;
    }

    getAllProperties(dn: string) : ItemProperties
    {
        const allProps = this._getProperties(dn) ?? {};
        return allProps;
    }

    getProperties(dn: string, id: PropsId) : SnapshotPropsConfig
    {
        const allProps = this._getProperties(dn) ?? {};
        const props = allProps[id] ?? {};
        return props || {};
    }

    getAlerts(dn: string) : Alert[]
    {
        const alerts = this._getAlerts(dn) ?? [];
        return alerts;
    }

    getNodes() : RegistryStateNode[]
    {
        return _.values(this._nodeMap);
    }

    getNodeDns() : string[]
    {
        return _.keys(this._nodeMap);
    }

    getNode(dn: string) : SnapshotNodeConfig | null
    {
        const node = this._nodeMap[dn];
        if (!node) {
            return null;
        }
        return node.config;
    }

    findByKind(kind: NodeKind) : Record<string, RegistryStateNode>
    {
        const res = this._kindMap[kind];
        if (!res) {
            return {}
        }
        return res;
    }

    findByDn(dn: string) : RegistryStateNode | null
    {
        const res = this._nodeMap[dn];
        if (!res) {
            return null;
        }
        return res;
    }

    countByKind(kind: NodeKind) : number
    {
        return _.keys(this.findByKind(kind)).length;
    }

    childrenByKind(parentDn: string, kind: NodeKind) : string[]
    {
        const newResult : Record<string, boolean> = {};
        const childDns = this._childrenMap[parentDn];
        if (childDns) {
            for(const childDn of childDns) {
                const childNode = this.getNode(childDn);
                if (childNode) {
                    if (childNode.kind == kind)
                    {
                        newResult[childDn] = true;
                    }
                }
            }
        }
        return _.keys(newResult);
    }

    scopeByKind(ancestorDn: string, kind: NodeKind) : string[]
    {
        const result = this.findByKind(kind);
        const newResult : Record<string, boolean> = {};
        for(const key of _.keys(result))
        {
            if (_.startsWith(key, ancestorDn))
            {
                newResult[key] = true;
            }
        }
        return _.keys(newResult);
    }

    countScopeByKind(ancestorDn: string, kind: NodeKind) : number
    {
        const result = this.findByKind(kind);
        let count = 0;
        for(const key of _.keys(result))
        {
            if (_.startsWith(key, ancestorDn))
            {
                count++;
            }
        }
        return count;
    }

    scopeFlat(ancestorDn: string) : RegistryStateNode[]
    {
        const nodes = this.getNodes();
        const newResult = nodes.filter(x => _.startsWith(x.dn, ancestorDn));
        return newResult;
    }

    getChildrenDns(dn: string) : string[]
    {
        const childDns = this._childrenMap[dn];
        if (childDns) {
            return childDns;
        }
        return [];
    }

    addNewItem(item: SnapshotItemInfo) : void
    {
        switch (item.config_kind)
        {
            case SnapshotConfigKind.node:
                {
                    const config = <SnapshotNodeConfig>item.config;
                    this._addTreeNode(item.dn, config);
                }
                break;

            case SnapshotConfigKind.props:
                {
                    const config = <SnapshotPropsConfig>item.config;
                    const props = this._fetchProperties(item.dn);
                    props[config.id] = config;
                }
                break;

            case SnapshotConfigKind.alerts:
                {
                    const config = <SnapshotAlertsConfig>item.config;
                    const alerts = this._fetchAlerts(item.dn);
                    for(const x of config)
                    {
                        alerts.push(x);
                    }
                }
                break;
        }
    }

    extractSnapshotInfo() : SnapshotInfo
    {
        const snapshotInfo : SnapshotInfo = {
            date: this.date,
            items: []
        };

        for(const node of this.getNodes())
        {
            snapshotInfo.items.push({
                dn: node.dn,
                kind: node.kind,
                config_kind: SnapshotConfigKind.node,
                config: node.config
            });

            const props = this.getAllProperties(node.dn);
            for(const prop of _.values(props))
            {
                snapshotInfo.items.push({
                    dn: node.dn,
                    kind: node.kind,
                    config_kind: SnapshotConfigKind.props,
                    config: prop
                });
            }

            const alerts = this.getAlerts(node.dn);
            if (alerts.length > 0)
            {
                snapshotInfo.items.push({
                    dn: node.dn,
                    kind: node.kind,
                    config_kind: SnapshotConfigKind.alerts,
                    config: alerts
                });
            }
        }

        return snapshotInfo;
    }

    private _transform(snapshotInfo: SnapshotInfo)
    {
        for(const item of snapshotInfo.items)
        {
            this.addNewItem(item);
        }
    }

    private _addTreeNode(dn: string, nodeConfig: SnapshotNodeConfig)
    {
        const node = new RegistryStateNode(
            this,
            dn,
            nodeConfig,
            this._fetchProperties(dn),
            this._fetchAlerts(dn)
        );

        this._nodeMap[dn] = node;

        if (!this._kindMap[nodeConfig.kind])
        {
            this._kindMap[nodeConfig.kind] = {};
        }
        this._kindMap[nodeConfig.kind]![dn] = node;

        this._registerChild(dn);
    }

    private _registerChild(dn: string)
    {
        const parent_dn = parentDn(dn);
        if (parent_dn) {
            let parent = this._childrenMap[parent_dn];
            if (!parent) {
                parent = [];
                this._childrenMap[parent_dn] = parent;
            }
            parent.push(dn);
        }
    }

    private _getProperties(dn: string)
    {
        const props = this._propertiesMap[dn];
        return props;
    }

    private _getAlerts(dn: string)
    {
        const alerts = this._alertsMap[dn];
        return alerts;
    }

    private _fetchProperties(dn: string) : ItemProperties
    {
        let props = this._propertiesMap[dn];
        if (!props) {
            props = {};
            this._propertiesMap[dn] = props;
        }
        return props;
    }

    private _fetchAlerts(dn: string) : Alert[]
    {
        let alerts = this._alertsMap[dn];
        if (!alerts) {
            alerts = [];
            this._alertsMap[dn] = alerts;
        }
        return alerts;
    }

    raiseAlert(dn: string, alertInfo: Alert) : void
    {
        const alerts = this._fetchAlerts(dn);
        alerts.push(alertInfo);
    }

    raiseMarker(dn: string, name: string) : void
    {
        const node = this._nodeMap[dn];
        if (!node) {
            return;
        }

        node.raiseMarker(name);
    }

    postProcessAlerts(cb: (dn: string, alerts: Alert[]) => void) : void
    {
        for(const dn of _.keys(this._alertsMap))
        {
            cb(dn, this._alertsMap[dn]);
        }
    }

    buildBundle() : RegistryBundleState
    {
        if (this._stateBundle) {
            throw new Error("Is already bundled");
        }

        const newBundleState = new RegistryBundleState(this); 
        this._stateBundle = newBundleState;
        return newBundleState;
    }

    async debugOutputToDir(logger: ILogger, relPath: string)
    {
        for(const dn of _.keys(this._nodeMap))
        {
            const filePath = `${relPath}/${sanitizeDnPath(dn)}/node.json`;
            const node = this._nodeMap[dn];
            await logger.outputFile(filePath, node.config);
        }

        for(const dn of _.keys(this._childrenMap))
        {
            const filePath = `${relPath}/${sanitizeDnPath(dn)}/children.json`;
            const children = this._childrenMap[dn];
            await logger.outputFile(filePath, children);
        }
 
        for(const dn of _.keys(this._propertiesMap))
        {
            const propsMap = this._propertiesMap[dn];

            for(const propName of _.keys(propsMap))
            {
                const props = propsMap[propName];
                const filePath = `${relPath}/${sanitizeDnPath(dn)}/props-${props.id}.json`;
                await logger.outputFile(filePath, props);
            }
        }

        for(const dn of _.keys(this._alertsMap))
        {
            const filePath = `${relPath}/${sanitizeDnPath(dn)}/alerts.json`;
            const alerts = this._alertsMap[dn];
            if (alerts.length > 0) {
                await logger.outputFile(filePath, alerts);
            }
        }
    }

}