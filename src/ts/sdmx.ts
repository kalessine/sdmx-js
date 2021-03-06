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
/// <amd-module name='sdmx'/>
import commonreferences = require("sdmx/commonreferences");
import message = require("sdmx/message");
import interfaces = require("sdmx/interfaces");
import sdmx20 = require("sdmx/sdmx20");
import sdmx21 = require("sdmx/sdmx21");
import abs = require("sdmx/abs");
import oecd = require("sdmx/oecd");
import knoema = require("sdmx/knoema");
import nomis = require("sdmx/nomis");
import ilo = require("sdmx/ilo");
import estat = require("sdmx/estat");
export class SdmxIO {
    public static SANITISE_NAMES: boolean = false;
    public static PARSER: Array<interfaces.SdmxParserProvider> = [];
    public static TRUNCATE_NAMES: number = 100;
    public static getLocale(): string {
        return SdmxIO.getLanguage();
    }
    public static isSanitiseNames(): boolean {
        return SdmxIO.SANITISE_NAMES;

    }
    public static parseStructure(s: string): message.StructureType {
        for (var i = 0; i < SdmxIO.PARSER.length; i++) {
            if (SdmxIO.PARSER[i].canParse(s)) { return SdmxIO.PARSER[i].parseStructure(s); }
            //else {
            //    alert("not my type");
            //}
        }
        return null;
    }
    public static parseData(s: string): message.DataMessage {
        for (var i = 0; i < SdmxIO.PARSER.length; i++) {
            if (SdmxIO.PARSER[i].canParse(s)) { return SdmxIO.PARSER[i].parseData(s); }
        }
        return null;
    }
    public static registerParserProvider(p: interfaces.SdmxParserProvider) {
        SdmxIO.PARSER.push(p);

    }
    public static listServices(): Array<string> {
        return ["NOMIS", "ABS",
            "OECD", "KNOEMA", "AfDB", "ILO", "ESTAT"];
        //return ["OECD"];
    }
    public static connect(s: string): interfaces.Queryable {
        if (s == "ABS") return new abs.ABS("ABS", "http://cors-anywhere.herokuapp.com/http://stat.abs.gov.au/restsdmx/sdmx.ashx/", "");
        if (s == "KNOEMA") return new knoema.Knoema("KNOEMA", "http://knoema.com/api/1.0/sdmx", "");
        if (s == "NOMIS") return new nomis.NOMISRESTServiceRegistry("NOMIS", "http://www.nomisweb.co.uk/api", "uid=0xad235cca367972d98bd642ef04ea259da5de264f");
        if (s == "OECD") return new oecd.OECD("OECD", "http://stats.oecd.org/restsdmx/sdmx.ashx/", "");
        if (s == "AfDB") return new knoema.Knoema("AfDB", "http://opendataforafrica.org/api/1.0/sdmx", "");
        if (s == "ILO") return new ilo.ILO("ILO", "http://cors-anywhere.herokuapp.com/http://www.ilo.org/ilostat/sdmx/ws/rest", "");
        if (s == "ESTAT") return new estat.ESTAT("ESTAT", "http://ec.europa.eu/eurostat/SDMX/diss-web/rest", "");
    }
    public static setTruncateNames(n: number) {
        SdmxIO.TRUNCATE_NAMES = n;
    }
    public static truncateName(s: string) {
        if (SdmxIO.TRUNCATE_NAMES) {
            return s.substring(0, SdmxIO.TRUNCATE_NAMES);
        }
        return s;
    }
    private static languages = [];
    private static language = window.navigator.userLanguage || window.navigator.language || "en";
    public static registerLanguage(s: string) {
        for (var i: number = 0; i < this.languages.length; i++) {
            if (this.languages[i] == s) return;
        }
        this.languages.push(s);
    }
    public static listLanguages(): Array<string> {
        return this.languages;
    }
    public static setLanguage(s: string) {
        this.language = s;
    }
    public static getLanguage(): string {
        return this.language;
    }
    public static reference(agency: string, id: string, vers: string): commonreferences.Reference {
        var ref = new commonreferences.Ref();
        ref.setAgencyId(new commonreferences.NestedNCNameID(agency));
        ref.setMaintainableParentId(new commonreferences.ID(id));
        if (vers != null) {
            ref.setVersion(new commonreferences.Version(vers));
        }
        var reference: commonreferences.Reference = new commonreferences.Reference(ref, null);
        return reference;
    }
}
SdmxIO.registerParserProvider(new sdmx20.Sdmx20StructureParser());
SdmxIO.registerParserProvider(new sdmx21.Sdmx21StructureParser());
