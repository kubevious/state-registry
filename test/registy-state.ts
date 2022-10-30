import 'mocha';
import should = require('should');

import _ from 'the-lodash';
import { setupLogger, LoggerOptions } from 'the-logger';

const loggerOptions = new LoggerOptions().enableFile(false).pretty(true);
const logger = setupLogger('test', loggerOptions);

import { RegistryState } from '../src/registry-state';
import { SnapshotInfo } from '../src/types/snapshot';

import * as FileUtils from './utils/file-utils';

import { NodeKind, parseDn } from '@kubevious/entity-meta';

describe('registry-state', function() {

    it('parse-small-test', function() {
        const state = loadRegistryState('snapshot-items-small.json');

        const nsNode = state.getNode('root/ns-[kube-public]');
        should(nsNode).be.an.Object();
        should(nsNode!.kind).be.a.String().and.equal("ns");
        // should(nsNode.).be.an.Object();
    });

    it('parse-large-test', function() {
        const state = loadRegistryState('snapshot-items-large.json');

        const dn = 'root/ns-[kubevious]/app-[kubevious-ui]/launcher-[Deployment]';
        const stateNode = state.getNode(dn);
        should(stateNode).be.an.Object();

        const bundle = state.buildBundle();

        const deploymentNode = bundle.getNodeItem(dn);
        should(deploymentNode).be.an.Object();

        const props = state.getProperties(dn);
        (props).should.be.an.Object();
        should(props['config']).be.an.Object();

        const alerts = state.getAlerts(dn);
        should(alerts).be.an.Array;
        
        const hierarchyAlerts = deploymentNode!.hierarchyAlerts
        should(hierarchyAlerts).be.an.Array;
    })

    it('findByKind', function() {
        const state = loadRegistryState('snapshot-items-large.json');

        const result = state.findByKind(NodeKind.launcher);
        should(result).be.an.Object();
        should(_.keys(result).length).be.equal(77);

        for(const item of _.values(result))
        {
            (item).should.be.an.Object();
            (item.kind).should.be.equal('launcher');
        }
    })

    it('scopeByKind', function() {
        const state = loadRegistryState('snapshot-items-large.json');

        const result = state.scopeByKind('root/ns-[kubevious]', NodeKind.launcher);
        should(result).be.an.Object();
        should(_.keys(result).length).be.equal(4);

        for(const dn of _.values(result))
        {
            (dn).should.be.a.String();
            const parsedDn = parseDn(dn);
            const rn = _.last(parsedDn);
            should(rn).be.ok();
            should(rn!.kind).be.equal('launcher');
        }
    });

    it('countScopeByKind', function() {
        const state = loadRegistryState('snapshot-items-large.json');

        const result = state.countScopeByKind('root/ns-[kubevious]', NodeKind.launcher);
        should(result).be.equal(4);
    });

    it('childrenByKind', function() {
        const state = loadRegistryState('snapshot-items-large.json');

        const result = state.childrenByKind('root/ns-[kubevious]/app-[kubevious-ui]', NodeKind.service);
        should(result).be.an.Array();
        should(result.length).be.equal(1);

        const parsedDn = parseDn(result[0]);
        const rn = _.last(parsedDn);
        should(rn).be.ok();
        should(rn?.kind).be.equal(NodeKind.service);
        should(rn?.name).be.equal('NodePort');
    });

    it('build-bundle', function() {
        const state = loadRegistryState('snapshot-items-small.json');

        const bundle = state.buildBundle();
        (bundle).should.be.an.Object();

        for(const item of bundle.nodeItems)
        {
            (item).should.be.an.Object();
            (item.dn).should.be.a.String();
            (item.config).should.be.an.Object();
        }

        {
            const myDn = 'root/ns-[kube-system]';

            const myNode = bundle.getNodeItem(myDn);
            should(myNode).be.ok();

            should(myNode!.selfAlertCount).be.eql({ error: 0, warn: 0 });
            should(myNode!.alertCount).be.eql({ error: 11, warn: 11 });
        }

        {
            const myDn = 'root/ns-[kube-system]/app-[fluentd-gcp-scaler]';

            const myNode = bundle.getNodeItem(myDn);
            should(myNode).be.ok();

            should(myNode!.selfAlertCount).be.eql({ error: 1, warn: 0});
            should(myNode!.alertCount).be.eql({ error: 1, warn: 0 });
        }
    })

    it('debug-output-to-file-test', function() {
        const state = loadRegistryState('snapshot-items-small.json');

        const fileLoggerOptions = new LoggerOptions().enableFile(true).cleanOnStart(true).pretty(true);
        const fileLogger = setupLogger('FILE', fileLoggerOptions);

        return state.debugOutputToDir(fileLogger, 'my-registry');
    });

    it('extract-snapshot-info', function() {
        const state = loadRegistryState('snapshot-items-small.json');

        const fileLoggerOptions = new LoggerOptions().enableFile(true).cleanOnStart(true).pretty(true);
        const fileLogger = setupLogger('FILE', fileLoggerOptions);

        const snapshotInfo = state.extractSnapshotInfo();
        const contents = JSON.stringify(snapshotInfo, null, 4);
        return fileLogger.outputFile("registry-small-snapshot.json", contents);
    });


    it('debug-output-name-sanitize', function() {
        const state = loadRegistryState('snapshot-items-small.json');

        {
            const dn = 'root/logic/ns-[kubevious]';
            const sanitized = state.sanitizeDnPath(dn);
            should(sanitized).be.equal('root/logic/ns-[kubevious]');
        }
        
        {
            const dn = 'root/logic/ns-[kubevious]/image-[kubevious/ui]';
            const sanitized = state.sanitizeDnPath(dn);
            should(sanitized).be.equal('root/logic/ns-[kubevious]/image-[kubevious_ui]');
        }

    });


});

function loadRegistryState(filePath: string) : RegistryState
{
    const data = FileUtils.readJsonData(filePath);
    const snapshotInfo = <SnapshotInfo> {
        date: data.date,
        items: _.values(data.items)
    };
    const state = new RegistryState(snapshotInfo);
    return state;
}