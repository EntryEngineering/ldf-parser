"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseString = exports.parseFile = exports.isResultEmpty = void 0;
let result = {
    frames: {},
    signals: {}
};
function isResultEmpty(res) {
    let empty = true;
    Object.values(res).forEach(value => {
        if (Object.keys(value).length > 0) {
            empty = false;
        }
    });
    return empty;
}
exports.isResultEmpty = isResultEmpty;
function parseFile(file) {
    result = {
        frames: {},
        signals: {}
    };
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.onerror = () => {
            reader.abort();
            reject(new DOMException("Problem parsing input file."));
        };
        reader.onload = () => {
            if (reader.result) {
                const ldf = parseString(reader.result.toString());
                if (isResultEmpty(ldf)) {
                    reject(new DOMException("Problem parsing input file."));
                }
                else {
                    resolve(ldf);
                }
            }
        };
        reader.readAsText(file, 'ISO-8859-15');
    });
}
exports.parseFile = parseFile;
function parseString(ldfString) {
    const lines = ldfString.split(/\r?\n/);
    // HEADER
    const startIndex = lines.findIndex(line => line === "LIN_description_file;");
    result.header = {
        LIN_protocol_version: lines[startIndex + 1].split(/\"/)[1],
        LIN_language_version: lines[startIndex + 2].split(/\"/)[1],
        LIN_speed: parseFloat(lines[startIndex + 3].split(' ')[2])
    };
    // NODES
    const nodesIndex = lines.findIndex(line => line === "Nodes {");
    let masterLine = lines[nodesIndex + 1].split(' ');
    const slaves = {};
    lines[nodesIndex + 2].split(": ")[1].slice(0, -1).split(", ").forEach(slaveName => { slaves[slaveName] = { name: slaveName }; });
    result.nodes = {
        master: {
            name: masterLine[1].split(",")[0],
            timerBase: parseFloat(masterLine[2]),
            jitter: parseFloat(masterLine[4])
        },
        slaves: slaves
    };
    // SIGNALS
    const signalsIndex = lines.findIndex(line => line === "Signals {");
    let actIndex = signalsIndex + 1;
    while (lines[actIndex] !== "}") {
        const signalLine = lines[actIndex].split(' ');
        const subscribers = signalLine.slice(4).map(subscriber => subscriber.slice(0, -1));
        result.signals[signalLine[0].slice(0, -1).trim()] = {
            name: signalLine[0].slice(0, -1).trim(),
            size: parseInt(signalLine[1].slice(0, -1)),
            initialValue: parseInt(signalLine[2].slice(0, -1)),
            publisher: signalLine[3].slice(0, -1),
            subscribers: subscribers
        };
        actIndex++;
    }
    //DIAGNOSTIC SIGNALS
    const diagnosticSignals = [];
    actIndex = lines.findIndex(line => line === "Diagnostic_signals {") + 1;
    while (lines[actIndex] !== "}") {
        const signalLine = lines[actIndex].split(/:|,|;/);
        diagnosticSignals.push({
            name: signalLine[0].trim(),
            size: parseInt(signalLine[1]),
            initialValue: parseInt(signalLine[2])
        });
        actIndex++;
    }
    result.diagnosticSignals = diagnosticSignals;
    // FRAMES
    actIndex = lines.findIndex(line => line === "Frames {") + 1;
    while (lines[actIndex] !== "}") {
        const frameLine = lines[actIndex].split(/: | |, /);
        const signals = {};
        actIndex++;
        while (lines[actIndex] !== "}") {
            const signalLine = lines[actIndex].split(/, |;/);
            signals[signalLine[0].trim()] = {
                name: signalLine[0].trim(),
                offset: parseInt(signalLine[1])
            };
            actIndex++;
        }
        result.frames[frameLine[0].trim()] = {
            name: frameLine[0].trim(),
            id: parseInt(frameLine[1]),
            publisher: frameLine[2],
            size: parseInt(frameLine[3]),
            signals: signals
        };
        actIndex++;
    }
    // NODE ATTRIBUTES
    actIndex = lines.findIndex(line => line === "Node_attributes {") + 1;
    while (lines[actIndex] !== "}") {
        const name = lines[actIndex].split(' ')[0].trim();
        const attributes = {};
        actIndex++;
        while (lines[actIndex].trim() !== "}") {
            const attributeLine = lines[actIndex].trim();
            if (attributeLine.startsWith("LIN_protocol"))
                attributes.LIN_protocol = attributeLine.split(/ |;/)[2];
            if (attributeLine.startsWith("configured_NAD"))
                attributes.configuredNAD = attributeLine.split("=")[1];
            if (attributeLine.startsWith("initial_NAD"))
                attributes.initialNAD = attributeLine.split("=")[1];
            if (attributeLine.startsWith("product_id"))
                attributes.productId = attributeLine.split(/=|;/)[1].split(", ");
            if (attributeLine.startsWith("response_error"))
                attributes.responseError = attributeLine.split("=")[1];
            if (attributeLine.startsWith("P2_min"))
                attributes.P2_min = parseFloat(attributeLine.split(' ')[2]);
            if (attributeLine.startsWith("ST_min"))
                attributes.ST_min = parseFloat(attributeLine.split(' ')[2]);
            if (attributeLine.startsWith("N_As_timeout"))
                attributes.N_As_timeout = parseFloat(attributeLine.split(' ')[2]);
            if (attributeLine.startsWith("N_Cr_timeout"))
                attributes.N_Cr_timeout = parseFloat(attributeLine.split(' ')[2]);
            if (attributeLine.startsWith("configurable_frames")) {
                attributes.configurableFrames = {};
                actIndex++;
                while (lines[actIndex].trim() !== "}") {
                    attributes.configurableFrames[lines[actIndex].split("=")[0].trim()] = lines[actIndex].split("=")[1].trim() || "";
                    actIndex++;
                }
            }
            actIndex++;
        }
        result.nodes.slaves[name].nodeAttributes = attributes;
        actIndex++;
    }
    // SCHEDULE TABLES
    actIndex = lines.findIndex(line => line === "Schedule_tables {") + 1;
    const scheduleTables = [];
    while (lines[actIndex] !== "}") {
        const scheduleTable = {
            name: lines[actIndex].split(' ')[0].trim(),
            commands: []
        };
        actIndex++;
        while (lines[actIndex].trim() !== "}") {
            const commandLine = lines[actIndex].split(' ');
            scheduleTable.commands.push({
                name: commandLine[0].trim(),
                delay: parseFloat(commandLine[2]),
                units: commandLine[3]
            });
            actIndex++;
        }
        scheduleTables.push(scheduleTable);
        actIndex++;
    }
    result.scheduleTables = scheduleTables;
    // SIGNAL ENCODING TYPES
    actIndex = lines.findIndex(line => line === "Signal_encoding_types {") + 1;
    result.signalEncodingTypes = {};
    while (lines[actIndex] !== "}") {
        const signalEncodingType = {
            name: lines[actIndex].split(' ')[0].trim()
        };
        actIndex++;
        while (lines[actIndex].trim() !== "}") {
            const valueLine = lines[actIndex].trim().split(/, |;/);
            if (valueLine[0] === "logical_value") {
                const logivalValue = {
                    signalValue: parseInt(valueLine[1]),
                    textInfo: valueLine[2] ? valueLine[2].slice(1, -1) : undefined
                };
                if (signalEncodingType.logicalValues)
                    signalEncodingType.logicalValues.push(logivalValue);
                else
                    signalEncodingType.logicalValues = [logivalValue];
            }
            else if (valueLine[0] === "physical_value") {
                const physicalRange = {
                    min: parseInt(valueLine[1]),
                    max: parseInt(valueLine[2]),
                    scale: parseFloat(valueLine[3]),
                    offset: parseFloat(valueLine[4]),
                    textInfo: valueLine[5] ? valueLine[5].slice(1, -1) : undefined
                };
                if (signalEncodingType.physicalRanges)
                    signalEncodingType.physicalRanges.push(physicalRange);
                else
                    signalEncodingType.physicalRanges = [physicalRange];
            }
            actIndex++;
        }
        result.signalEncodingTypes[signalEncodingType.name] = signalEncodingType;
        actIndex++;
    }
    // SIGNAL REPRESENTATION
    actIndex = lines.findIndex(line => line === "Signal_representation {") + 1;
    while (lines[actIndex] !== "}") {
        const line = lines[actIndex].trim().slice(0, -1).split(/: |, /);
        const signals = line.slice(1);
        if (result.signalEncodingTypes[line[0]])
            result.signalEncodingTypes[line[0]].signalRepresentation = signals;
        actIndex++;
    }
    return result;
}
exports.parseString = parseString;
