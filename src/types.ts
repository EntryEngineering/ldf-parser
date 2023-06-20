export type LdfResult = {
    header?: LdfHeader
    nodes?: Nodes
    signals: Signals
    diagnosticSignals?: DiagnosticSignal[],
    frames: Frames
    scheduleTables?: ScheduleTable[]
    signalEncodingTypes?: SignalEncodingTypes
}

export type LdfHeader = {
    LIN_protocol_version: string
    LIN_language_version: string
    LIN_speed: number
}

export type Nodes = {
    master: Master
    slaves: SlaveGroup
}

export type Master = {
    name: string
    timerBase: number
    jitter: number
}

export type Slave = {
    name: string
    nodeAttributes?: NodeAttributes
}

export type SlaveGroup = {
    [key: string]: Slave
}

export type Signal = {
    name: string
    size: number
    initialValue: number
    publisher: string
    subscribers: string[]
}

export type Signals = {
    [key: string]: Signal
}

export type FrameSignal = {
    name: string
    offset: number
}

export type FrameSignals = {
    [key: string]: FrameSignal
}

export type DiagnosticSignal = {
    name: string
    size: number
    initialValue: number
}

export type Frame = {
    name: string
    id: number
    publisher: string
    size: number
    signals: FrameSignals
}

export type Frames = {
    [key: string]: Frame
}

export type DiagnosticFrame = {
    name: string
}

export type NodeAttributes = {
    LIN_protocol?: string
    configuredNAD?: string
    initialNAD?: string
    productId?: string[]
    responseError?: string
    P2_min?: number
    ST_min?: number
    N_As_timeout?: number
    N_Cr_timeout?: number
    configurableFrames?: {
        [key: string]: string
    }
}

export type ScheduleTable = {
    name: string
    commands: ScheduleTableCommand[]
}

export type ScheduleTableCommand = {
    name: string
    delay: number
    units: string
}

export type SignalEncodingTypes = {
    [key: string]: SignalEncodingType
}

export type SignalEncodingType = {
    name: string
    logicalValues?: LogicalValue[]
    physicalRanges?: PhysicalRange[]
    signalRepresentation?: string[]
}

export type LogicalValue = {
    signalValue: number
    textInfo?: string
}

export type PhysicalRange = {
    min: number
    max: number
    scale: number
    offset: number
    textInfo?: string
}

export type SignalRepresentation = {
    signalEncodingTypeName: string
    signalNames: string[]
}