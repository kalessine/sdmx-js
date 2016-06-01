/*
    This file is part of sdmx-js.

    sdmx-js is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    sdmx-js is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with sdmx-js.  If not, see <http://www.gnu.org/licenses/>.
    Copyright (C) 2016 James Gardner
*/
///<reference path="../es6-promise.d.ts"/>
///<reference path="../moment.d.ts"/>
import moment = require("moment");
import interfaces = require("sdmx/interfaces");
import registry = require("sdmx/registry");
import structure = require("sdmx/structure");
import message = require("sdmx/message");
import commonreferences = require("sdmx/commonreferences");
import common = require("sdmx/common");
import sdmx = require("sdmx");
import data = require("sdmx/data");
import time = require("sdmx/time");
export function parseXml(s: string): any {
    var parseXml: DOMParser;
    parseXml = new DOMParser();
    var xmlDoc = parseXml.parseFromString(s, "text/xml");
    return xmlDoc;
}
export class NOMISRESTServiceRegistry implements interfaces.RemoteRegistry, interfaces.Queryable {

    private agency: string = "NOMIS";
    private serviceURL: string = "http://www.nomisweb.co.uk/api";
    private options: string = "uid=0xad235cca367972d98bd642ef04ea259da5de264f";
    private local: interfaces.LocalRegistry = new registry.LocalRegistry();

    private dataflowList: Array<structure.Dataflow> = null;

    getRemoteRegistry(): interfaces.RemoteRegistry {
        return this;
    }

    getRepository(): interfaces.Repository {
        return null;

    }

    clear() {
        this.local.clear();
    }
    query(flow: commonreferences.Reference, q: data.Query, startTime: string, endTime: string): Promise<message.DataMessage> {
        var geogIndex: number = flow.getMaintainableParentId().toString().lastIndexOf("_");
        var geog: string = flow.getMaintainableParentId().toString().substring(geogIndex + 1, flow.getMaintainableParentId().toString().length);
        var geography_string: string = "&geography=" + geog;
        if ("NOGEOG" == geog) {
            geography_string = "";
        }
        var id: string = flow.getMaintainableParentId().toString().substring(0, geogIndex);
        var dst_ref: commonreferences.Ref = new commonreferences.Ref();
        dst_ref.setAgencyId(flow.getAgencyId());
        dst_ref.setId(new commonreferences.ID(id));
        dst_ref.setVersion(flow.getVersion());
        var dst_reference = new commonreferences.Reference(dst_ref, null);
        var st: Promise<message.StructureType> = this.retrieve(this.getServiceURL() + "/v01/dataset/" + id + "/time/def.sdmx.xml");
        return st.then(function(struc: message.StructureType) {
            var times: string = "&TIME=";
            var timeCL: structure.Codelist = struc.getStructures().getCodeLists().getCodelists()[0];
            var rtpStart: time.RegularTimePeriod = time.TimeUtil.parseTime("", startTime);
            var rtpEnd: time.RegularTimePeriod = time.TimeUtil.parseTime("", endTime);
            var comma: boolean = true;
            for (var i: number = 0; i < timeCL.size(); i++) {
                var rtp: time.RegularTimePeriod = time.TimeUtil.parseTime("", timeCL.getItems()[i].getId().toString());
                var ts = moment(rtp.getStart());
                var te = moment(rtp.getEnd());
                var startMoment = moment(rtpStart.getStart());
                var endMoment = moment(rtpEnd.getEnd());
                if (ts.isBetween(startMoment, endMoment)) {
                    if (!comma) {
                        times += ",";
                        comma = true;
                    }
                    times += timeCL.getItem(i).getId().toString();
                    comma = false;
                }
            }
            var queryString: string = "";
            var kns = q.getKeyNames();
            for (var i: number = 0; i < kns.length; i++) {
                var name: string = kns[i];
                var values = q.getQueryKey(kns[i]).getValues();
                if (i == 0) {
                    queryString += "?";
                } else {
                    queryString += "&";
                }
                queryString += name + "=";
                for (var j: number = 0; j < values.length; j++) {
                    queryString += values[j];
                    if (j < values.length - 1) {
                        queryString += ",";
                    }
                }
            }
            return this.retrieveData("http://www.nomisweb.co.uk/api/v01/dataset/" + dst_ref.getId() + ".compact.sdmx.xml" + queryString + times + "&"+this.options);
        }.bind(this));
        /*
        StringBuilder q = new StringBuilder();
        for (int i = 0; i < structure.getDataStructureComponents().getDimensionList().size(); i++) {
            DimensionType dim = structure.getDataStructureComponents().getDimensionList().getDimension(i);
            boolean addedParam = false;
            String concept = dim.getConceptIdentity().getId().toString();
            List<String> params = message.getQuery().getDataWhere().getAnd().get(0).getDimensionParameters(concept);
            System.out.println("Params=" + params);
            if (params.size() > 0) {
                addedParam = true;
                q.append(concept + "=");
                for (int j = 0; j < params.size(); j++) {
                    q.append(params.get(j));
                    if (j < params.size() - 1) {
                        q.append(",");
                    }
                }
            }
            if (addedParam && i < structure.getDataStructureComponents().getDimensionList().size() - 1) {
                q.append("&");
            }
            addedParam = false;
        }
        DataMessage msg = null;
        msg = query(pparams, getServiceURL() + "/v01/dataset/" + id + ".compact.sdmx.xml?" + q + "&time=" + times.toString() + geography_string +"&" + options);
        */
        //return null;
    }
    constructor(agency: string, service: string, options: string) {
        if (service != null) {
            this.serviceURL = service;
        } else {

        }
        if (agency != null) {
            this.agency = agency;
        }
        if (options != null) {
            this.options = options;
        }
    }

    load(struct: message.StructureType) {
        console.log("nomis load");
        this.local.load(struct);
    }

    unload(struct: message.StructureType) {
        this.local.unload(struct);
    }
    makeRequest(opts): Promise<string> {
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            console.log("nomis retrieve:" + opts.url);
            xhr.open(opts.method, opts.url);
            xhr.onload = function() {
                if (this.status >= 200 && this.status < 300) {
                    resolve(xhr.responseText);
                } else {
                    reject({
                        status: this.status,
                        statusText: xhr.statusText
                    });
                }
            };
            xhr.onerror = function() {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            };
            if (opts.headers) {
                Object.keys(opts.headers).forEach(function(key) {
                    xhr.setRequestHeader(key, opts.headers[key]);
                });
            }
            var params = opts.params;
            // We'll need to stringify if we've been given an object
            // If we have a string, this is skipped.
            if (params && typeof params === 'object') {
                params = Object.keys(params).map(function(key) {
                    return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
                }).join('&');
            }
            xhr.send(params);
        });
    }
    public retrieve(urlString: string): Promise<message.StructureType> {
        var s: string = this.options;
        if (urlString.indexOf("?") == -1) {
            s = "?" + s + "&random=" + new Date().getTime();
        } else {
            s = "&" + s + "&random=" + new Date().getTime();
        }
        var opts: any = {};
        opts.url = urlString + s;
        opts.method = "GET";
        return this.makeRequest(opts).then(function(a) {
            return sdmx.SdmxIO.parseStructure(a);
        });
    }
    public retrieveData(urlString: string): Promise<message.DataMessage> {
        var s: string = this.options;
        if (urlString.indexOf("?") == -1) {
            s = "?" + s + "&random=" + new Date().getTime();
        } else {
            s = "&" + s + "&random=" + new Date().getTime();
        }
        var opts: any = {};
        opts.url = urlString + s;
        opts.method = "GET";
        return this.makeRequest(opts).then(function(a) {
            return sdmx.SdmxIO.parseData(a);
        });
    }
    public retrieve2(urlString: string): Promise<string> {
        console.log("nomis retrieve:" + urlString);
        var s: string = this.options;
        if (urlString.indexOf("?") == -1) {
            s = "?" + s + "&random=" + new Date().getTime();
        } else {
            s = "&" + s + "&random=" + new Date().getTime();
        }
        var opts: any = {};
        opts.url = urlString;
        opts.method = "GET";
        return this.makeRequest(opts).then(function(a) {
            return a;
        });
    }
    /*
      This function ignores the version argument!!!
      ILO stat does not use version numbers.. simply take the latest
     */

    public findDataStructure(ref: commonreferences.Reference): Promise<structure.DataStructure> {
        var dst: structure.DataStructure = this.local.findDataStructure(ref);
        if (dst != null) {
            var promise = new Promise(function(resolve, reject) {
                resolve(dst);
            }.bind(this));
            return promise;
        } else {
            var geogIndex = ref.getMaintainableParentId().toString().lastIndexOf("_");
            var geog: string = ref.getMaintainableParentId().toString().substring(geogIndex + 1, ref.getMaintainableParentId().toString().length);
            var geography_string: string = "geography=" + geog;
            if ("NOGEOG" == geog) {
                geography_string = "";
            }
            var id: string = ref.getMaintainableParentId().toString().substring(0, geogIndex);
            return this.retrieve(this.getServiceURL() + "/v01/dataset/" + id + ".structure.sdmx.xml?" + geography_string).then(function(a) {
                a.getStructures().getDataStructures().getDataStructures()[0].setId(ref.getMaintainableParentId());
                a.getStructures().getDataStructures().getDataStructures()[0].setVersion(ref.getVersion());
                this.load(a);
                return this.local.findDataStructure(ref);
            }.bind(this));
        }
    }
    public listDataflows(): Promise<Array<structure.Dataflow>> {
        if (this.dataflowList != null) {
            var promise = new Promise(function(resolve, reject) {
                resolve(this.dataflowList);
            }.bind(this));
            return promise;
        } else {
            var promise = new Promise(function(resolve, reject) {
                var st: message.StructureType = this.retrieve(this.serviceURL + "/v01/dataset/def.sdmx.xml");
                var list: Array<structure.DataStructure> = st.getStructures().getDataStructures().getDataStructures();
                var dfs: Array<structure.Dataflow> = [];
                for (var i: number = 0; i < list.length; i++) {
                    var dst: structure.DataStructure = list[i];
                    var cubeId: string = structure.NameableType.toIDString(dst);
                    var cubeName: string = dst.findName("en").getText();
                    var url: string = this.serviceURL + "/v01/dataset/" + cubeId + ".overview.xml";
                    var geogList: Array<NOMISGeography> = this.parseGeography(this.retrieve2(url), cubeId, cubeName);
                    for (var j = 0; j < geogList.length; j++) {
                        var dataFlow: structure.Dataflow = new structure.Dataflow();
                        dataFlow.setAgencyID(new commonreferences.NestedNCNameID((this.agency)));
                        dataFlow.setId(new commonreferences.ID(cubeId + "_" + geogList[j].getGeography()));
                        var name: common.Name = new common.Name("en", cubeName + " " + geogList[j].getGeographyName());
                        var names: Array<common.Name> = [];
                        names.push(name);
                        dataFlow.setNames(names);
                        var ref: commonreferences.Ref = new commonreferences.Ref();
                        ref.setAgencyId(new commonreferences.NestedNCNameID(this.agency));
                        ref.setMaintainableParentId(dataFlow.getId());
                        ref.setVersion(commonreferences.Version.ONE);
                        var reference = new commonreferences.Reference(ref, null);
                        dataFlow.setStructure(reference);
                        dfs.push(dataFlow);
                    }
                    if (geogList.length == 0) {
                        var dataFlow: structure.Dataflow = new structure.Dataflow();
                        dataFlow.setAgencyID(new commonreferences.NestedNCNameID((this.agency)));
                        dataFlow.setId(new commonreferences.ID(cubeId + "_NOGEOG"));
                        var name: common.Name = new common.Name("en", cubeName);
                        var names: Array<common.Name> = [];
                        names.push(name);
                        dataFlow.setNames(names);
                        var ref: commonreferences.Ref = new commonreferences.Ref();
                        ref.setAgencyId(new commonreferences.NestedNCNameID(this.agency));
                        ref.setMaintainableParentId(dataFlow.getId());
                        ref.setVersion(commonreferences.Version.ONE);
                        var reference = new commonreferences.Reference(ref, null);
                        dataFlow.setStructure(reference);
                        dfs.push(dataFlow);
                    }
                }
                this.dataflowList = dfs;
                resolve(dfs);
            }.bind(this));
            return promise;
        }

    }
    public getServiceURL(): string {
        return this.serviceURL;
    }
    public parseGeography(doc: string, cubeId: string, cubeName: string): Array<NOMISGeography> {
        var geogList: Array<NOMISGeography> = [];
        var tagContent: string = null;
        var lastLang: string = null;
        var xmlDoc = parseXml(doc);
        var dimNode = this.findNodeName("Dimensions", xmlDoc.documentElement.childNodes);
        var dimsNode = this.searchNodeName("Dimension", dimNode.childNodes);
        var geogNode = null;
        for (var i = 0; i < dimsNode.length; i++) {
            if (dimsNode[i].getAttribute("concept") == "geography") {
                geogNode = dimsNode[i];
            }
        }
        if (geogNode == null) return geogList;
        var typesNode = this.findNodeName("Types", geogNode.childNodes);
        if (typesNode == null) return geogList;
        var typeArray = this.searchNodeName("Type", typesNode.childNodes);
        if (typeArray.length == 0) {
            return geogList;
        }
        for (var i: number = 0; i < typeArray.length; i++) {
            var ng: NOMISGeography = new NOMISGeography(typeArray[i].getAttribute("value"), typeArray[i].getAttribute("name"), cubeName, cubeId);
            geogList.push(ng);
        }
        return geogList;
    }
    recurseDomChildren(start: any, output: any) {
        var nodes;
        if (start.childNodes) {
            nodes = start.childNodes;
            this.loopNodeChildren(nodes, output);
        }
    }

    loopNodeChildren(nodes: Array<any>, output: any) {
        var node;
        for (var i = 0; i < nodes.length; i++) {
            node = nodes[i];
            if (output) {
                this.outputNode(node);
            }
            if (node.childNodes) {
                this.recurseDomChildren(node, output);
            }
        }
    }
    outputNode(node: any) {
        var whitespace = /^\s+$/g;
        if (node.nodeType === 1) {
            console.log("element: " + node.tagName);
        } else if (node.nodeType === 3) {
            //clear whitespace text nodes
            node.data = node.data.replace(whitespace, "");
            if (node.data) {
                console.log("text: " + node.data);
            }
        }
    }
    findNodeName(s: string, childNodes: any) {
        for (var i: number = 0; i < childNodes.length; i++) {
            var nn: string = childNodes[i].nodeName;
            //alert("looking for:"+s+": name="+childNodes[i].nodeName);
            if (nn.indexOf(s) == 0) {
                //alert("found node:"+s);
                return childNodes[i];
            }
        }
        return null;
    }
    searchNodeName(s: string, childNodes: any): Array<any> {
        var result: Array<any> = [];
        for (var i: number = 0; i < childNodes.length; i++) {
            var nn: string = childNodes[i].nodeName;
            //alert("looking for:"+s+": name="+childNodes[i].nodeName);
            if (nn.indexOf(s) == 0) {
                //alert("found node:"+s);
                result.push(childNodes[i]);
            }
        }
        if (result.length == 0) {
            //alert("cannot find any " + s + " in node");
        }
        return result;
    }
    findDataflow(ref: commonreferences.Reference): Promise<structure.Dataflow> {
        return null;
    }
    findCode(ref: commonreferences.Reference): Promise<structure.CodeType> { return null; }
    findCodelist(ref: commonreferences.Reference): Promise<structure.Codelist> { return null; }
    findItemType(item: commonreferences.Reference): Promise<structure.ItemType> { return null; }
    findConcept(ref: commonreferences.Reference): Promise<structure.ConceptType> { return null; }
    findConceptScheme(ref: commonreferences.Reference): Promise<structure.ConceptSchemeType> { return null; }
    searchDataStructure(ref: commonreferences.Reference): Promise<Array<structure.DataStructure>> { return null; }
    searchDataflow(ref: commonreferences.Reference): Promise<Array<structure.Dataflow>> { return null; }
    searchCodelist(ref: commonreferences.Reference): Promise<Array<structure.Codelist>> { return null; }
    searchItemType(item: commonreferences.Reference): Promise<Array<structure.ItemType>> { return null; }
    searchConcept(ref: commonreferences.Reference): Promise<Array<structure.ConceptType>> { return null; }
    searchConceptScheme(ref: commonreferences.Reference): Promise<Array<structure.ConceptSchemeType>> { return null; }
    getLocalRegistry(): interfaces.LocalRegistry {
        return this.local;
    }
    save(): any { }
}
export class NOMISGeography {
    private geography: string = "";
    private geographyName: string = "";
    private cubeName: string = "";
    private cubeId: string = "";
    constructor(geography: string, geographyName: string, cubeName: string, cubeId: string) {
        this.geography = geography;
        this.geographyName = geographyName;
        this.cubeName = cubeName;
        this.cubeId = cubeId;

    }
    getGeography() {
        return this.geography;
    }
    getCubeName() { return this.cubeName; }
    getCubeId() {
        return this.cubeId;
    }
    getGeographyName() {
        return this.geographyName;
    }

}
