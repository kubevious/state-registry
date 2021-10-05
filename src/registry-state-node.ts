import _ from 'the-lodash';
import { ItemProperties, RegistryState } from './registry-state';
import { Alert } from './types/alert';
import { SnapshotNodeConfig, SnapshotPropsConfig  } from './types/configs';

export class RegistryStateNode
{
    private _state : RegistryState;
    private _dn : string;
    private _config: SnapshotNodeConfig;
    private _propertiesMap: ItemProperties;
    private _selfAlerts: Alert[];
    private _markers: Record<string, boolean> = {};

    constructor(state: RegistryState, dn: string, config: SnapshotNodeConfig, propertiesMap: ItemProperties, alerts: Alert[])
    {
        this._state = state;
        this._dn = dn;
        this._config = config;
        this._propertiesMap = propertiesMap;
        this._selfAlerts = alerts;
    }

    get dn() : string {
        return this._dn;
    }

    get kind() : string  {
        return this.config.kind;
    }

    get rn() : string  {
        return this.config.rn;
    }

    get name() : string | undefined {
        return this.config.name;
    }

    get config(): SnapshotNodeConfig {
        return this._config;
    }

    get childrenCount() : number {
        const childDns = this._state.getChildrenDns(this.dn);
        return childDns.length;
    }

    get labels(): SnapshotPropsConfig {
        // TODO: validate logic
        // return this._propertiesMap['labels'] || {};
        return this._propertiesMap['labels']?.config ?? {};
    }

    get annotations(): SnapshotPropsConfig {
        // TODO: validate logic
        // return this._propertiesMap['annotations'] || {};
        return this._propertiesMap['annotations']?.config ?? {};
    }

    get selfAlerts() : Alert[] {
        return this._selfAlerts;
    }

    get markers() : string[] {
        return _.keys(this._markers);
    }

    get markersDict() : Record<string, boolean>  {
        return this._markers;
    }

    get propertiesMap() : ItemProperties {
        return this._propertiesMap;
    }

    getProperties(name: string) : SnapshotPropsConfig | null
    {
        const props = this._propertiesMap[name];
        if (!props) {
            return null;
        }
        return props;
    }

    getPropertiesConfig(name: string) : any
    {
        const props = this._propertiesMap[name];
        if (!props) {
            return {};
        }
        return props.config || {};
    }

    raiseMarker(name: string) : void
    {
        this._markers[name] = true;
    }

}

