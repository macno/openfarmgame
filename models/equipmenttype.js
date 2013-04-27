// equipmenttype.js
//
// data object representing a type of plant used in farming
//
// Copyright 2013, StatusNet Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var _ = require("underscore"),
    async = require("async"),
    fs = require("fs"),
    path = require("path"),
    DatabankObject = require("databank").DatabankObject;

var EquipmentType = DatabankObject.subClass("equipmenttype");

EquipmentType.schema = {
    "equipmenttype": {
        pkey: "slug",
        fields: ["name",
                 "cost",
                 "usetime",
                 "created",
                 "updated"]
    },
    "equipmenttypelist": {
        pkey: "dummy"
    }
};

EquipmentType.beforeCreate = function(props, callback) {
    if (!props.slug) {
        callback(new Error("No slug!"), null);
        return;
    }
    props.created = Date.now();
    props.updated = props.created;
    callback(null, props);
};

EquipmentType.prototype.afterCreate = function(callback) {
    var type = this;
    var bank = EquipmentType.bank();
    bank.append("equipmenttypelist", 0, type.slug, function(err, list) {
        callback(err);
    });
};

EquipmentType.prototype.beforeUpdate = function(props, callback) {
    if (!props.slug) {
        callback(new Error("No slug!"), null);
        return;
    }
    props.updated = Date.now();
    callback(null, props);
};

EquipmentType.prototype.beforeSave = function(callback) {
    var type = this;
    if (!type.slug) {
        callback(new Error("No slug!"));
        return;
    }
    type.updated = Date.now();
    if (!type.created) {
        type.created = Date.now();
    }
    callback(null);
};

EquipmentType.prototype.afterSave = function(callback) {
    var type = this;
    var bank = EquipmentType.bank();
    bank.indexOf("equipmenttypelist", 0, type.slug, function(err, index) {
        if ((err && err.name == "NoSuchThingError") ||
            index === -1) {
            bank.append("equipmenttypelist", 0, type.slug, callback);
        } else {
            callback(null);
        }
    });
};

EquipmentType.getAll = function(callback) {
    var bank = EquipmentType.bank();

    async.waterfall([
        function(callback) {
            bank.read("equipmenttypelist", 0, callback);
        },
        function(slugs, callback) {
            EquipmentType.readArray(slugs, callback);
        }
    ], function(err, equipments) {
        if (err) {
            callback(err, null);
        } else {
            _.sortBy(equipments, "cost");
            callback(null, equipments);
        }
    });
};

EquipmentType.initialData = function(callback) {

    var fname = path.join(__dirname, "..", "data", "equipmenttypes.json");

    async.waterfall([
        function(callback) {
            fs.readFile(fname, "utf8", callback);
        },
        function(data, callback) {
            var arr;
            try {
                arr = JSON.parse(data);
                callback(null, arr);
            } catch(e) {
                callback(e, null);
            }
        },
        function(specs, callback) {
            async.forEach(specs,
                          function(spec, callback) {
                              var type = new EquipmentType(spec);
                              type.save(callback);
                          },
                          callback);
        }
    ], function(err, results) {
        callback(err);
    });
};

module.exports = EquipmentType;
