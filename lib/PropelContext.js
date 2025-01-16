const jsforce = require('jsforce')
const https = require('https')
const PropelHelper = require('./PropelHelper')
const PropelConnect = require('./PropelConnect')
const { logger } = require('./Logger');

// handled app constants
const PDLM_APP = 'PDLM';

const APP_INFO = {
    [PDLM_APP]: {
        namespace: 'PDLM',
        sobjName: 'Item__c'
    }
};

/**
 * Standard context parameter for propel services.
 * Contains connection to salesforce, app namespace info, and ability to create / reference common services.
 * 
 * TODO: would like to refactor services to take a PropelContext as constructor parameter... then could eliminate the helper functions that create the services here.
 * 
 * To create this, use the createPropelContext functin rather than instantiating directly -- this will give you an intialiized instance.
 */
class PropelContext {
    
    connection;     // salesforce connection
    namespace;      // namespace for app objects (e.g. PDLM)
    orgNamespace;   // org namespace
    app;            // app name (e.g. PDLM)

    async init ({connection, app = PDLM_APP} = {}) {
        this.app = app;
        this.connection = connection;
        this.orgNamespace = await this.lookupOrgNamespace();
        this.namespace = await this.lookupAppNamespace(app);
        return this;
    }

    createPropelHelper({mapping = {}, options = {}} = {}) {
        return new PropelHelper(this.connection, mapping, this.namespace, options);
    }

    /**
     * Queries the connected org to find the org namespace
     */
    async lookupOrgNamespace() {
        let queryRes = await this.connection.query("select id, NamespacePrefix from Organization");
        let org = queryRes?.records?.shift();
        return org?.NamespacePrefix;
    }

    /**
     * Attempts to lookup the namespace for an app according to the following algorithm: 
     * If the org namespace matches the default app namespace, then use that (e.g. PDLM)
     * If the org namespace is not set, then use the default app namespace (e.g. PDLM)
     * If the org namespace does not match the default app namespace, then describe a default object 
     *   that exists in the app (e.g. PDLM__Item__c) to see if it is in the PDLM namespace or the org namespace
     * 
     * Note -- org namespace is assumed to already be set when this is called.
     */
    async lookupAppNamespace(app) {
        let defaultInfo = APP_INFO[app];
        if (!defaultInfo) {
            throw new Error(`Unknown app ${app}`);
        }

        let namespace = defaultInfo.namespace;
        if (this.connection && this.orgNamespace && this.orgNamespace !== defaultInfo.namespace) {
            let defaultObjName = `${defaultInfo.namespace}__${defaultInfo.sobjName}`;
            try {
                let queryRes = await this.connection.sobject(defaultObjName).describe();
                if (queryRes?.fields?.length) {
                    // use default ns bc obj exists (e.g. PDLM__Item__c) -- even though the org ns is different
                    namespace = defaultInfo.namespace; 
                } else {
                    throw new Error('Default object not found.');
                }             
            } catch (e) {
                logger.debug(`${defaultObjName} not found. Using org namespace: ${this.orgNamespace}`);
                namespace = this.orgNamespace;
            }
        }
        return namespace;
    }

}

/**
 * Creates an initialized PropelContext instance.
 * If a connection is passed in, then uses that connection, otherwise attempts to create one from the hostUrl / sessionId
 * Initializes by calling init() for the given app (default is PDLM).
 */
const createPropelContext = async ({hostUrl, sessionId, connection, app = PDLM_APP} = {}) => {
    // establish connection
    if (!connection) {
        let propelConnect = new PropelConnect(hostUrl, sessionId);
        connection = propelConnect.conn;
    }

    return new PropelContext().init({connection, app});
}

module.exports = { createPropelContext };
