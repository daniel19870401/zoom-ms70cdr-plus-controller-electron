const state = {
  midiAccess: null,
  output: null,
  input: null,
  deviceId: 0x6e,
  effectToggle: false,
  initialized: false,
  initPromise: null,
  patchCount: null,
  patchLength: null,
  bankCount: null,
  patchesPerBank: null,
  currentBank: null,
  currentProgram: null,
  currentPatchName: null,
  bankMsb: null,
  bankLsb: null,
  patchNameSource: null,
  initResolve: null,
  initTimeout: null,
  lastPatchDumpRequest: 0,
  effectIds: [],
  effectNames: [],
  effectMappings: null,
  nameUpdateTimer: null,
  effectParams: [],
  effectEnabled: [],
  fullSyncTimer: null,
  pendingPatchDump: false,
  lastMemorySlot: null,
};

const elements = {
  connect: document.getElementById('connect'),
  refresh: document.getElementById('refresh'),
  initDevice: document.getElementById('init-device'),
  outputSelect: document.getElementById('midi-output'),
  inputSelect: document.getElementById('midi-input'),
  sysexStatus: document.getElementById('sysex-status'),
  initStatus: document.getElementById('init-status'),
  log: document.getElementById('log'),
  deviceId: document.getElementById('device-id'),
  quickCommands: document.getElementById('quick-commands'),
  effectSlot: document.getElementById('effect-slot'),
  paramNumber: document.getElementById('param-number'),
  paramValue: document.getElementById('param-value'),
  paramValueRead: document.getElementById('param-value-read'),
  sendParam: document.getElementById('send-param'),
  toggleEffect: document.getElementById('toggle-effect'),
  effectValue: document.getElementById('effect-value'),
  effectName: document.getElementById('effect-name'),
  effectFullName: document.getElementById('effect-full-name'),
  syncPatch: document.getElementById('sync-patch'),
  patchName: document.getElementById('patch-name'),
  patchPosition: document.getElementById('patch-position'),
  patchBank: document.getElementById('patch-bank'),
  patchProgram: document.getElementById('patch-program'),
  patchCount: document.getElementById('patch-count'),
  patchBankCount: document.getElementById('patch-bank-count'),
  patchPerBank: document.getElementById('patch-per-bank'),
  patchLength: document.getElementById('patch-length'),
};

const initTemplate = [0xf0, 0x52, 0x00, 'ID', 0x64, 0x13, 0xf7];
const patchCountTemplate = [0xf0, 0x52, 0x00, 'ID', 0x07, 0xf7];
const patchInfoTemplate = [0xf0, 0x52, 0x00, 'ID', 0x44, 0xf7];
const currentBankTemplate = [0xf0, 0x52, 0x00, 'ID', 0x33, 0xf7];
const paramEditEnableTemplate = [0xf0, 0x52, 0x00, 'ID', 0x50, 0xf7];

const effectIdToName = {
  0x01000048: '160 Comp',
  0x08000048: 'Ac TpEcho',
  0x090000c1: 'AirReverb',
  0x090000a1: 'Ambience',
  0x06000051: 'AnalogCho',
  0x08000021: 'AnalogDly',
  0x080000e1: 'A-Pan DLY',
  0x07000011: 'AutoPan',
  0x02000010: 'AutoWah',
  0x02000025: 'A-Filter',
  0x09000098: 'Arena',
  0x02000048: 'Bass Cry',
  0x020000d4: 'BassGEQ',
  0x020000dc: 'BassPEQ',
  0x06000071: 'BendCho',
  0x060000fa: 'BF_Flanger2',
  0x07000050: 'BitCrush',
  0x07000040: 'Bomber',
  0x09000070: 'BrghtHall',
  0x09000020: 'BrghtRoom',
  0x02000035: 'BassA-Wah',
  0x06000057: 'Ba Chorus',
  0x06000085: 'Ba Detune',
  0x0600005c: 'Ba_Ensmbl',
  0x060000ea: 'BaFlanger',
  0x06000148: 'Ba AnaOct',
  0x06000138: 'BaOctaver',
  0x060000f5: 'BaVinFLNG',
  0x020000f0: 'Bottom B',
  0x09000140: 'Cave Reverb',
  0x06000056: 'CE_Cho5',
  0x090000b1: 'Chamber',
  0x06000011: 'Chorus',
  0x09000091: 'ChurchREV',
  0x06000020: 'CloneCho',
  0x01000010: 'Comp',
  0x06000041: 'TriChorus',
  0x06000038: 'CoronaCho',
  0x02000040: 'CryFilter',
  0x02000095: 'Comb Filter',
  0x08000011: 'Delay',
  0x06000081: 'Detune',
  0x080000d8: 'DriveEcho',
  0x08000051: 'DualDelay',
  0x01000055: 'DualComp',
  0x060000d0: 'Duo Phase',
  0x06000098: 'DuoTrem',
  0x080000f8: 'DynaDelay',
  0x06000108: 'DynaFLNGR',
  0x01000088: 'Dirty Gate',
  0x090001c0: 'Dual Reverb',
  0x09000190: 'Dyna Reverb',
  0x06000059: 'Ensemble',
  0x090000d1: 'EarlyRef',
  0x020000e0: 'Exciter',
  0x09000160: 'Echo Reverb',
  0x09000040: 'FD Spring',
  0x060000e5: 'Flanger',
  0x080000b1: 'FilterDly',
  0x080000b5: 'FilterPPD',
  0x090000e1: 'GateRevrb',
  0x06000180: 'GEMINOS',
  0x01000030: 'GrayComp',
  0x020000a0: 'Gt GEQ',
  0x09000061: 'Hall REV',
  0x09000081: 'HD Hall',
  0x08000110: 'HoldDelay',
  0x090000f0: 'HoldRevrb',
  0x06000161: 'HPS',
  0x09000180: 'Holy Reverb',
  0x08000101: 'ICE Delay',
  0x06000100: 'Kick FLNG',
  0x02000060: 'LFO FLTR',
  0x07000f00: 'LineSel',
  0x080000ba: 'LoFiDelay',
  0x09000130: 'LO-FI Rever',
  0x07000020: 'LoopRoll',
  0x02000030: 'LowPassFL',
  0x01000065: 'Limiter',
  0x0100005a: 'MB Comp',
  0x0600007a: 'MirageCho',
  0x08000058: 'MultiTapD',
  0x080000a8: 'ModDelay2',
  0x080000a1: 'ModDelay',
  0x09000120: 'ModReverb',
  0x07000060: 'MonoSynth',
  0x090001b0: 'Mangled Spa',
  0x01000080: 'NoiseGate',
  0x06000131: 'Octaver',
  0x01000040: 'OptComp',
  0x0100006a: 'Orange Limi',
  0x020000d0: 'ParaEQ',
  0x09000111: 'ParticleR',
  0x080000d1: 'PhaseDly',
  0x060000a1: 'Phaser',
  0x080000c1: 'Pitch DLY',
  0x09000051: 'Plate REV',
  0x06000171: 'PolyShift',
  0x06000150: 'PolyOct',
  0x08000080: 'P-P Delay',
  0x01000020: 'RackComp',
  0x02000020: 'Reso FLTR',
  0x06000190: 'RingMod',
  0x02000080: 'RndmFLTR',
  0x09000011: 'RoomREV',
  0x07000080: 'RtCloset',
  0x08000091: 'ReverseDL',
  0x09000150: 'Reverse Rev',
  0x02000070: 'SeqFLTR',
  0x090001a8: 'Shimmer2',
  0x06000075: 'SilkyCho',
  0x090000d8: 'Slap Back R',
  0x080000f1: 'SlwAtkDly',
  0x060001a1: 'Slicer',
  0x08000071: 'SlapBackD',
  0x01000090: 'SlowATTCK',
  0x08000068: 'SmoothDly',
  0x08000061: 'SoftEcho',
  0x09000101: 'SpaceHole',
  0x02000110: 'Splitter',
  0x09000031: 'SpringREV',
  0x020000d8: 'St Ba GEQ',
  0x06000061: 'StereoCho',
  0x0800007a: 'StereoDly',
  0x02000090: 'StepFLTR',
  0x020000c0: 'St Gt GEQ',
  0x08000075: 'StompDly',
  0x060000b0: 'StonePha',
  0x06000031: 'ChorusOne',
  0x06000120: 'SwellVibe',
  0x090001a0: 'Shimmer Rev',
  0x0200009a: 'SlowFLTR',
  0x09000036: 'Spring Reve',
  0x08000031: 'TapeEcho',
  0x08000120: 'TrgHldDly',
  0x060000e1: 'TheVibe',
  0x08000041: 'TapeEcho3',
  0x0600008a: 'Tremolo',
  0x080000c8: 'TremDelay',
  0x06000090: 'ORG Trem',
  0x09000028: 'TiledRoom',
  0x09000170: 'Tremolo Rev',
  0x06000111: 'Vibrato',
  0x060000f1: 'VinFLNGR',
  0x06000053: 'VintageCE',
  0x060000c0: 'WarpPhase',
  0x01000070: 'ZNR',
  0x07000070: 'Z-Organ',
  0x0200002a: 'Z TronFLT',
  0x07000ff0: 'BPM',
};

const quickCommandTemplates = [
  {
    name: 'Param Edit Enable',
    description: '進入即時參數編輯模式',
    template: [0xf0, 0x52, 0x00, 'ID', 0x50, 0xf7],
  },
  {
    name: 'Param Edit Disable',
    description: '退出即時參數編輯模式',
    template: [0xf0, 0x52, 0x00, 'ID', 0x51, 0xf7],
  },
  {
    name: 'PC Mode On',
    description: '啟用 Program Change 模式',
    template: [0xf0, 0x52, 0x00, 'ID', 0x52, 0xf7],
  },
  {
    name: 'PC Mode Off',
    description: '關閉 Program Change 模式',
    template: [0xf0, 0x52, 0x00, 'ID', 0x53, 0xf7],
  },
  {
    name: 'Tuner On',
    description: '開啟調音器',
    template: [0xf0, 0x52, 0x00, 'ID', 0x64, 0x0b, 0xf7],
  },
  {
    name: 'Tuner Off',
    description: '關閉調音器',
    template: [0xf0, 0x52, 0x00, 'ID', 0x64, 0x0c, 0xf7],
  },
  {
    name: 'Get Current Patch',
    description: '要求回傳目前 Patch',
    template: [0xf0, 0x52, 0x00, 'ID', 0x64, 0x13, 0xf7],
  },
  {
    name: 'Get Bank / Patch Info',
    description: '回傳 Bank / Patch 資訊',
    template: [0xf0, 0x52, 0x00, 'ID', 0x44, 0xf7],
  },
  {
    name: 'Get Total Patch Count',
    description: '回傳總 Patch 數量',
    template: [0xf0, 0x52, 0x00, 'ID', 0x07, 0xf7],
  },
  {
    name: 'Identity Request',
    description: 'MIDI Identity Request',
    template: [0xf0, 0x7e, 0x7f, 0x06, 0x01, 0xf7],
  },
];

function logLine(message, type = 'info') {
  const prefix = type === 'error' ? '[ERR] ' : type === 'warn' ? '[WARN] ' : '[OK] ';
  if (!elements.log) {
    console[type === 'error' ? 'error' : 'log'](`${prefix}${message}`);
    return;
  }
  const line = document.createElement('div');
  line.textContent = `${prefix}${message}`;
  elements.log.appendChild(line);
  elements.log.scrollTop = elements.log.scrollHeight;
}

function toHex(byte) {
  return byte.toString(16).padStart(2, '0').toUpperCase();
}

function bytesToHex(bytes) {
  return bytes.map((byte) => toHex(byte)).join(' ');
}

function readUInt16LE(bytes, offset) {
  if (offset + 1 >= bytes.length) return null;
  return bytes[offset] + (bytes[offset + 1] << 8);
}

function readUInt32LE(bytes, offset) {
  if (offset + 3 >= bytes.length) return null;
  return (
    (bytes[offset] |
      (bytes[offset + 1] << 8) |
      (bytes[offset + 2] << 16) |
      (bytes[offset + 3] << 24)) >>>
    0
  );
}

function readAscii(bytes, offset, length) {
  if (offset + length > bytes.length) return null;
  let output = '';
  for (let i = 0; i < length; i += 1) {
    output += String.fromCharCode(bytes[offset + i]);
  }
  return output;
}

function getDeviceSlotFromInput() {
  const value = Number(elements.effectSlot.value);
  if (Number.isNaN(value)) return null;
  const slot = value - 1;
  if (slot < 0 || slot > 5) return null;
  return slot;
}

function setInputSlot(slot) {
  if (!elements.effectSlot) return;
  if (slot === null || slot === undefined) {
    elements.effectSlot.value = '';
    return;
  }
  const value = Number(slot);
  if (Number.isNaN(value) || value < 0 || value > 5) {
    return;
  }
  elements.effectSlot.value = String(value + 1);
}

function getNumberFromBits(data, startBit, endBit) {
  const startByte = Math.floor(startBit / 8);
  const endByte = Math.floor(endBit / 8);
  const startBitOffset = startBit % 8;
  const endBitOffset = endBit % 8;
  const startMask = 0b0000000011111111 >> startBitOffset;
  const endMask = (0b1111111100000000 >> (endBitOffset + 1)) & 0b11111111;
  let value = 0;

  for (let i = endByte; i >= startByte; i -= 1) {
    let byte = data[i];
    if (i === startByte) byte &= startMask;
    if (i === endByte) byte &= endMask;
    value += byte << ((endByte - i) * 8);
  }
  value = value >> (7 - endBitOffset);
  return value;
}

function seven2eight(sevenBitBytes, start = 0, end = -1) {
  if (end === -1) end = sevenBitBytes.length - 1;
  const remainder = (end - start + 1) % 8;
  const size =
    Math.floor((end - start + 1) / 8) * 7 + (remainder < 2 ? 0 : remainder - 1);
  const eightBitBytes = new Uint8Array(size);
  let eightIndex = 0;
  let highBits = 0;
  let sevenIndex = start;

  while (sevenIndex <= end) {
    const seven = sevenBitBytes[sevenIndex];
    const bitIndex = 7 - ((sevenIndex - start) % 8);
    if (bitIndex === 7) {
      highBits = seven;
    } else {
      eightBitBytes[eightIndex++] = seven + (((highBits >> bitIndex) & 1) << 7);
    }
    sevenIndex += 1;
  }

  return eightBitBytes;
}

function parsePTCFPatch(data) {
  const header = readAscii(data, 0, 4);
  if (header !== 'PTCF') return null;
  const totalLength = readUInt32LE(data, 4);
  if (totalLength === null) return null;
  const end = Math.min(data.length, 8 + totalLength);
  let offset = 8;
  const version = readUInt32LE(data, offset);
  offset += 4;
  const numEffects = readUInt32LE(data, offset);
  offset += 4;
  const target = readUInt32LE(data, offset);
  offset += 4;
  offset += 6;
  const shortName = readAscii(data, offset, 10);
  offset += 10;

  const effectIds = [];
  if (numEffects !== null) {
    for (let i = 0; i < numEffects; i += 1) {
      const id = readUInt32LE(data, offset);
      if (id !== null) effectIds.push(id);
      offset += 4;
    }
  }

  let name = null;
  let edtbChunk = null;
  while (offset + 8 <= end) {
    const chunkId = readAscii(data, offset, 4);
    offset += 4;
    const chunkLength = readUInt32LE(data, offset);
    offset += 4;
    if (!chunkId || chunkLength === null) break;
    if (offset + chunkLength > end) break;
    if (chunkId === 'NAME') {
      name = readAscii(data, offset, chunkLength);
    }
    if (chunkId === 'EDTB') {
      edtbChunk = data.slice(offset, offset + chunkLength);
    }
    offset += chunkLength;
  }

  const effectSettings = [];
  if (edtbChunk && numEffects !== null) {
    const blockSize = 24;
    const count = Math.min(numEffects, Math.floor(edtbChunk.length / blockSize));
    for (let i = 0; i < count; i += 1) {
      const block = edtbChunk.slice(i * blockSize, i * blockSize + blockSize);
      const reversed = Uint8Array.from(block).reverse();
      let bitpos = reversed.length * 8 - 1;
      const enabled = getNumberFromBits(reversed, bitpos, bitpos) === 1;
      bitpos -= 1;
      const id = getNumberFromBits(reversed, bitpos - 28, bitpos);
      bitpos -= 29;
      const parameters = [];
      for (let p = 0; p < 5 && bitpos - 12 >= 0; p += 1) {
        const param = getNumberFromBits(reversed, bitpos - 11, bitpos);
        bitpos -= 12;
        parameters.push(param);
      }
      for (let p = 5; p < 8 && bitpos - 8 >= 0; p += 1) {
        const param = getNumberFromBits(reversed, bitpos - 7, bitpos);
        bitpos -= 8;
        parameters.push(param);
      }
      for (let p = 8; p < 12 && bitpos - 12 >= 0; p += 1) {
        const param = getNumberFromBits(reversed, bitpos - 11, bitpos);
        bitpos -= 12;
        parameters.push(param);
      }
      effectSettings.push({ id, enabled, parameters });
    }
  }

  return {
    version,
    target,
    shortName: shortName ? shortName.replace(/\0/g, '').trim() : null,
    name: name ? name.replace(/\0/g, '').trim() : null,
    effectIds,
    effectSettings,
  };
}

function findChunk(data, chunkId) {
  const target = chunkId.split('').map((ch) => ch.charCodeAt(0));
  for (let i = 0; i + 8 <= data.length; i += 1) {
    if (
      data[i] === target[0] &&
      data[i + 1] === target[1] &&
      data[i + 2] === target[2] &&
      data[i + 3] === target[3]
    ) {
      const length = readUInt32LE(data, i + 4);
      if (length === null) return null;
      if (i + 8 + length > data.length) return null;
      return { offset: i + 8, length };
    }
  }
  return null;
}

function parsePatchFromChunks(data) {
  const nameChunk = findChunk(data, 'NAME');
  const edtbChunk = findChunk(data, 'EDTB');
  const name = nameChunk ? readAscii(data, nameChunk.offset, nameChunk.length) : null;

  const effectSettings = [];
  if (edtbChunk) {
    const blockSize = 24;
    const count = Math.floor(edtbChunk.length / blockSize);
    for (let i = 0; i < count; i += 1) {
      const start = edtbChunk.offset + i * blockSize;
      const block = data.slice(start, start + blockSize);
      const reversed = Uint8Array.from(block).reverse();
      let bitpos = reversed.length * 8 - 1;
      const enabled = getNumberFromBits(reversed, bitpos, bitpos) === 1;
      bitpos -= 1;
      const id = getNumberFromBits(reversed, bitpos - 28, bitpos);
      bitpos -= 29;
      const parameters = [];
      for (let p = 0; p < 5 && bitpos - 12 >= 0; p += 1) {
        const param = getNumberFromBits(reversed, bitpos - 11, bitpos);
        bitpos -= 12;
        parameters.push(param);
      }
      for (let p = 5; p < 8 && bitpos - 8 >= 0; p += 1) {
        const param = getNumberFromBits(reversed, bitpos - 7, bitpos);
        bitpos -= 8;
        parameters.push(param);
      }
      for (let p = 8; p < 12 && bitpos - 12 >= 0; p += 1) {
        const param = getNumberFromBits(reversed, bitpos - 11, bitpos);
        bitpos -= 12;
        parameters.push(param);
      }
      effectSettings.push({ id, enabled, parameters });
    }
  }

  return {
    name: name ? name.replace(/\0/g, '').trim() : null,
    effectSettings,
  };
}

function parseMSOGPatch(data) {
  const maxNumEffects = 6;
  const effectSettings = [];
  let offset = 0;
  const blockSize = 18;

  for (let i = 0; i < maxNumEffects; i += 1) {
    if (offset + blockSize > data.length) break;
    const block = data.slice(offset, offset + blockSize);
    offset += blockSize;
    const reversed = Uint8Array.from(block).reverse();
    let bitpos = reversed.length * 8 - 1;
    const enabled = getNumberFromBits(reversed, bitpos, bitpos) === 1;
    bitpos -= 1;
    const id = getNumberFromBits(reversed, bitpos - 27, bitpos);
    bitpos -= 28;
    const parameters = [];
    // P0-P2: 13 bits each
    for (let p = 0; p < 3 && bitpos - 12 >= 0; p += 1) {
      const param = getNumberFromBits(reversed, bitpos - 12, bitpos);
      bitpos -= 13;
      parameters.push(param);
    }
    // P3-P7: 8 bits each
    for (let p = 3; p < 8 && bitpos - 8 >= 0; p += 1) {
      const param = getNumberFromBits(reversed, bitpos - 7, bitpos);
      bitpos -= 8;
      parameters.push(param);
    }
    // Skip unknown bits and read P8 (8 bits)
    bitpos -= 20;
    if (bitpos - 7 >= 0) {
      const param = getNumberFromBits(reversed, bitpos - 7, bitpos);
      bitpos -= 8;
      parameters.push(param);
    }
    effectSettings.push({ id, enabled, parameters });
  }

  if (offset + 3 > data.length) {
    return { name: null, effectSettings };
  }
  offset += 3; // unknown1

  let name = null;
  if (offset + 10 <= data.length) {
    name = readAscii(data, offset, 10);
    offset += 10;
  }

  return {
    name: name ? name.replace(/\0/g, '').trim() : null,
    effectSettings,
  };
}

async function loadEffectMappings() {
  try {
    const response = await fetch('data/zoom-effect-mappings-ms70cdrp.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const map = new Map();
    Object.keys(data).forEach((key) => {
      const id = parseInt(key, 16);
      const entry = data[key];
      if (Number.isNaN(id) || !entry) return;
      map.set(id, {
        name: entry.name || entry.screenName || 'Unknown',
        screenName: entry.screenName || entry.name || 'Unknown',
        parameters: Array.isArray(entry.parameters) ? entry.parameters : [],
      });
    });
    state.effectMappings = map;
    updateEffectNameUI();
    updateParamOptions();
    logLine('已載入效果器參數對應表');
  } catch (error) {
    logLine(`載入參數對應表失敗：${error.message}`, 'warn');
  }
}

function parseDeviceId() {
  const raw = elements.deviceId.value.trim();
  if (!raw) {
    return null;
  }
  const value = parseInt(raw, 16);
  if (Number.isNaN(value) || value < 0 || value > 0x7f) {
    return null;
  }
  return value;
}

function setDeviceId() {
  const parsed = parseDeviceId();
  if (parsed === null) {
    logLine('Device ID 格式錯誤，請輸入 00-7F 的 16 進位。', 'error');
    return;
  }
  state.deviceId = parsed;
  resetInitialization('Device ID 已變更，請重新初始化。');
  logLine(`Device ID 設定為 0x${toHex(parsed)}`);
}

function autoSetDeviceId(value) {
  if (value === null || value === undefined) return;
  if (value === state.deviceId) return;
  state.deviceId = value;
  if (elements.deviceId) {
    elements.deviceId.value = toHex(value);
  }
  logLine(`偵測到 Device ID：0x${toHex(value)}`);
}

function normalizeTemplate(template) {
  return template.map((byte) => (byte === 'ID' ? state.deviceId : byte));
}

function sendSysexRaw(bytes, label = 'SysEx') {
  if (!state.output) {
    logLine('尚未選擇 MIDI 輸出。', 'error');
    return false;
  }
  try {
    state.output.send(bytes);
    logLine(`${label} 已送出: ${bytesToHex(bytes)}`);
    return true;
  } catch (error) {
    logLine(`SysEx 送出失敗：${error.message}`, 'error');
    return false;
  }
}

function buildInitMessage() {
  return normalizeTemplate(initTemplate);
}

function updateInitStatus() {
  if (!elements.initStatus) return;
  if (state.initialized) {
    elements.initStatus.textContent = '已初始化';
    elements.initStatus.classList.remove('subtle');
  } else {
    elements.initStatus.textContent = '未初始化';
    elements.initStatus.classList.add('subtle');
  }
}

function updateEffectValue() {
  if (!elements.effectValue) return;
  const value = state.effectToggle ? 1 : 0;
  elements.effectValue.textContent = `效果狀態：${state.effectToggle ? '啟用' : '停用'} (${value})`;
}

function formatValue(value) {
  return value === null || value === undefined ? '-' : String(value);
}

function updatePatchUI() {
  if (!elements.patchName) return;
  const nameSuffix = state.patchNameSource === 'heuristic' ? ' (推測)' : '';
  elements.patchName.textContent = state.currentPatchName
    ? `${state.currentPatchName}${nameSuffix}`
    : '尚未讀取';

  elements.patchBank.textContent = formatValue(state.currentBank);
  elements.patchProgram.textContent =
    state.currentProgram === null || state.currentProgram === undefined
      ? '-'
      : `${state.currentProgram + 1} (raw ${state.currentProgram})`;

  elements.patchCount.textContent = formatValue(state.patchCount);
  if (elements.patchBankCount) {
    elements.patchBankCount.textContent = formatValue(state.bankCount);
  }
  elements.patchPerBank.textContent = formatValue(state.patchesPerBank);
  elements.patchLength.textContent = formatValue(state.patchLength);

  let positionText = '第 - / - 個';
  if (state.currentBank !== null && state.currentProgram !== null) {
    const patchesPerBankForPosition = 10;
    const absolute =
      state.currentBank * patchesPerBankForPosition + state.currentProgram + 1;
    if (state.patchCount) {
      positionText = `第 ${absolute} / ${state.patchCount} 個`;
    } else {
      positionText = `第 ${absolute} 個`;
    }
  }
  elements.patchPosition.textContent = positionText;
  updateEffectNameUI();
  updateParamOptions();
}

function getEffectNameById(id) {
  if (id === null || id === undefined) return null;
  const mapped = state.effectMappings?.get(id);
  const name = mapped?.screenName || mapped?.name || effectIdToName[id];
  if (name) return name;
  return `未知效果 (${id.toString(16).toUpperCase()})`;
}

function updateEffectNameUI() {
  if (!elements.effectName || !elements.effectFullName) return;
  const slot = getDeviceSlotFromInput();
  if (slot === null) {
    elements.effectName.textContent = '效果器：-';
    elements.effectFullName.textContent = '-';
    return;
  }
  const id = state.effectIds[slot];
  if (id === undefined || id === null || id === 0) {
    elements.effectName.textContent = '效果器：空白';
    elements.effectFullName.textContent = '空白';
    return;
  }
  if (state.effectEnabled[slot] !== undefined) {
    state.effectToggle = state.effectEnabled[slot];
    updateEffectValue();
  }
  const name = getEffectNameById(id);
  elements.effectName.textContent = `效果器：${name}`;
  elements.effectFullName.textContent = name;
}

function scheduleFullSync(reason) {
  if (state.fullSyncTimer) {
    clearTimeout(state.fullSyncTimer);
  }
  state.fullSyncTimer = setTimeout(() => {
    state.fullSyncTimer = null;
    requestCurrentPatchDump();
  }, 200);
  if (reason) {
    logLine(`同步中：${reason}`);
  }
}

function applyParameterUpdate(effectSlot, paramNumber, paramValue, source = 'ACK') {
  if (!elements.paramNumber) return;
  if (Number.isNaN(effectSlot) || Number.isNaN(paramNumber) || Number.isNaN(paramValue)) return;

  setInputSlot(effectSlot);
  elements.paramNumber.dataset.selectedIndex = String(paramNumber);
  updateEffectNameUI();
  updateParamOptions();

  if (paramNumber > 0) {
    elements.paramNumber.value = String(paramNumber);
    elements.paramNumber.dataset.selectedIndex = String(paramNumber);
  }

  const param = getCurrentParam();
  if (paramNumber === 0) {
    state.effectToggle = paramValue === 1;
    state.effectEnabled[effectSlot] = state.effectToggle;
    updateEffectValue();
  } else {
    if (!state.effectParams[effectSlot]) state.effectParams[effectSlot] = [];
    state.effectParams[effectSlot][paramNumber - 1] = paramValue;
    updateParamRange(param || null);
    syncParamValueFromState();
  }

  logLine(`${source}: slot ${effectSlot}, param ${paramNumber}, value ${paramValue}`);
}

function applyEffectSlotChange(effectSlot) {
  if (Number.isNaN(effectSlot)) return;
  setInputSlot(effectSlot);
  updateEffectNameUI();
  updateParamOptions();
  logLine(`ACK: 目前效果槽位 ${effectSlot}`);
}

function getSelectedEffectMapping() {
  const slot = getDeviceSlotFromInput();
  if (slot === null) return null;
  const id = state.effectIds[slot];
  if (!id) return null;
  return state.effectMappings?.get(id) || null;
}

function getMappingForSlot(slot) {
  if (slot === null || slot === undefined) return null;
  const id = state.effectIds[slot];
  if (!id) return null;
  return state.effectMappings?.get(id) || null;
}

function getParamDefinition(slot, paramNumber) {
  if (!paramNumber || paramNumber <= 0) return null;
  const mapping = getMappingForSlot(slot);
  if (!mapping || !Array.isArray(mapping.parameters)) return null;
  return mapping.parameters[paramNumber - 1] || null;
}

function updateParamOptions() {
  if (!elements.paramNumber) return;
  const mapping = getSelectedEffectMapping();
  elements.paramNumber.innerHTML = '';

  if (!mapping || !Array.isArray(mapping.parameters) || mapping.parameters.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = state.effectMappings ? 'No parameters' : 'Mapping not loaded';
    elements.paramNumber.appendChild(option);
    elements.paramNumber.disabled = true;
    updateParamRange(null);
    return;
  }

  const previousIndex = Number(elements.paramNumber.dataset.selectedIndex ?? elements.paramNumber.value);

  mapping.parameters.forEach((param, index) => {
    const option = document.createElement('option');
    const value = index + 1;
    option.value = String(value);
    const label = param?.name ? `${value}: ${param.name}` : `Param ${value}`;
    option.textContent = label;
    elements.paramNumber.appendChild(option);
  });

  elements.paramNumber.disabled = false;
  const nextValue =
    Number.isNaN(previousIndex) || previousIndex < 1 || previousIndex > mapping.parameters.length
      ? 1
      : previousIndex;
  elements.paramNumber.value = String(nextValue);
  elements.paramNumber.dataset.selectedIndex = String(nextValue);
  updateParamRange(mapping.parameters[nextValue - 1]);
  syncParamValueFromState();
}

function updateParamRange(param) {
  const fallbackMax = 16383;
  if (!param) {
    elements.paramValue.min = '0';
    elements.paramValue.max = String(fallbackMax);
    elements.paramValue.value = '0';
    updateParamValueReadout();
    return;
  }
  const max = Number.isFinite(param.max) ? param.max : fallbackMax;
  const defaultValue = Number.isFinite(param.default) ? param.default : 0;
  elements.paramValue.min = '0';
  elements.paramValue.max = String(max);
  elements.paramValue.value = String(Math.min(defaultValue, max));
  updateParamValueReadout(param);
}

function getParamLabel(param, value) {
  if (!param || !Array.isArray(param.values)) return String(value);
  const raw = param.values[value];
  if (raw === undefined) return String(value);
  const label = decodeNumericEntities(raw);
  return `${label} (${value})`;
}

function decodeNumericEntities(input) {
  if (input === null || input === undefined) return input;
  const text = String(input);
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(parseInt(num, 10)));
}

function updateParamValueReadout(paramOverride = null) {
  if (!elements.paramValueRead) return;
  const param = paramOverride || getCurrentParam();
  const value = Number(elements.paramValue.value);
  elements.paramValueRead.textContent = getParamLabel(param, value);
}

function getCurrentParam() {
  const mapping = getSelectedEffectMapping();
  if (!mapping || !Array.isArray(mapping.parameters)) return null;
  const index = Number(elements.paramNumber.value);
  if (Number.isNaN(index) || index <= 0) return null;
  return mapping.parameters[index - 1] || null;
}

function getCurrentParamValue() {
  const slot = getDeviceSlotFromInput();
  const paramNumber = Number(elements.paramNumber.value);
  if (slot === null || Number.isNaN(paramNumber) || paramNumber <= 0) return null;
  const params = state.effectParams[slot];
  if (!params) return null;
  return params[paramNumber - 1];
}

function syncParamValueFromState() {
  const value = getCurrentParamValue();
  if (value === null || value === undefined) return;
  const maxValue = Number(elements.paramValue.max || 16383);
  elements.paramValue.value = String(Math.min(value, maxValue));
  updateParamValueReadout();
}

function resetInitialization(message) {
  state.initialized = false;
  state.initPromise = null;
  state.initResolve = null;
  if (state.initTimeout) {
    clearTimeout(state.initTimeout);
    state.initTimeout = null;
  }
  if (state.nameUpdateTimer) {
    clearTimeout(state.nameUpdateTimer);
    state.nameUpdateTimer = null;
  }
  state.currentPatchName = null;
  state.patchNameSource = null;
  state.patchCount = null;
  state.patchLength = null;
  state.bankCount = null;
  state.patchesPerBank = null;
  state.currentBank = null;
  state.currentProgram = null;
  state.bankMsb = null;
  state.bankLsb = null;
  state.lastPatchDumpRequest = 0;
  state.effectIds = [];
  state.effectNames = [];
  state.effectParams = [];
  state.effectEnabled = [];
  if (state.fullSyncTimer) {
    clearTimeout(state.fullSyncTimer);
    state.fullSyncTimer = null;
  }
  state.pendingPatchDump = false;
  state.lastMemorySlot = null;
  updateInitStatus();
  updatePatchUI();
  if (message) {
    logLine(message, 'warn');
  }
}

async function sendInit(force = false) {
  if (state.initPromise) return state.initPromise;
  if (state.initialized && !force) return true;

  state.initPromise = new Promise((resolve) => {
    state.initResolve = resolve;
  });

  if (force) {
    state.initialized = false;
    updateInitStatus();
  }

  const ok = sendSysexRaw(buildInitMessage(), 'Init (Get Current Patch)');
  if (!ok) {
    state.initPromise = null;
    if (state.initResolve) {
      state.initResolve(false);
    }
    return false;
  }

  state.initTimeout = setTimeout(() => {
    if (state.initPromise) {
      logLine('初始化逾時，未收到回應。', 'warn');
      state.initPromise = null;
      if (state.initResolve) {
        state.initResolve(false);
      }
      state.initResolve = null;
    }
  }, 2000);

  return state.initPromise;
}

async function sendSysex(bytes, label = 'SysEx', { requireInit = true } = {}) {
  if (requireInit) {
    const ready = await sendInit(false);
    if (!ready) return;
  }
  sendSysexRaw(bytes, label);
}

async function sendQuickCommand(template, name) {
  const bytes = normalizeTemplate(template);
  if (isInitMessage(bytes)) {
    await sendInit(true);
    return;
  }
  await sendSysex(bytes, name);
}

function updateSysexStatus() {
  if (!state.midiAccess) {
    elements.sysexStatus.textContent = 'SysEx 未啟用';
    return;
  }
  elements.sysexStatus.textContent = state.midiAccess.sysexEnabled
    ? 'SysEx 已啟用'
    : 'SysEx 未啟用';
}

function buildParameterMessage(slot, param, value) {
  const lsb = value & 0x7f;
  const msb = (value >> 7) & 0x7f;
  return [
    0xf0,
    0x52,
    0x00,
    state.deviceId,
    0x64,
    0x20,
    0x00,
    slot,
    param,
    lsb,
    msb,
    0x00,
    0x00,
    0x00,
    0xf7,
  ];
}

function buildEffectToggle(slot, enabled) {
  const value = enabled ? 0x01 : 0x00;
  return [
    0xf0,
    0x52,
    0x00,
    state.deviceId,
    0x64,
    0x20,
    0x00,
    slot,
    0x00,
    value,
    0x00,
    0x00,
    0x00,
    0x00,
    0xf7,
  ];
}

function sendProgramChange(bank, program, channel = 0) {
  if (!state.output) {
    logLine('尚未選擇 MIDI 輸出。', 'error');
    return;
  }
  const ch = Math.max(0, Math.min(15, channel));
  const safeProgram = Math.max(0, Math.min(127, program));
  const bankValue = Math.max(0, bank);
  const msb = (bankValue >> 7) & 0x7f;
  const lsb = bankValue & 0x7f;
  try {
    state.output.send([0xb0 | ch, 0x00, msb]);
    state.output.send([0xb0 | ch, 0x20, lsb]);
    state.output.send([0xc0 | ch, safeProgram]);
    logLine(`送出 Program Change: bank ${bankValue}, program ${safeProgram}, ch ${ch + 1}`);
  } catch (error) {
    logLine(`Program Change 送出失敗：${error.message}`, 'error');
  }
}

function isInitMessage(bytes) {
  const target = buildInitMessage();
  if (bytes.length !== target.length) return false;
  return bytes.every((byte, index) => byte === target[index]);
}

function extractPatchNameFromDump(bytes) {
  let best = '';
  let current = [];
  const pushCandidate = () => {
    if (current.length >= 4) {
      const text = String.fromCharCode(...current).trim();
      if (text.length >= 4 && text.length > best.length) {
        best = text;
      }
    }
    current = [];
  };

  bytes.forEach((byte) => {
    if (byte >= 0x20 && byte <= 0x7e) {
      if (current.length < 16) {
        current.push(byte);
      }
    } else {
      pushCandidate();
    }
  });
  pushCandidate();
  return best || null;
}

function finalizeInit() {
  state.initialized = true;
  if (state.initTimeout) {
    clearTimeout(state.initTimeout);
    state.initTimeout = null;
  }
  updateInitStatus();
  logLine('初始化完成，開始同步 Patch 資訊');
  if (state.initResolve) {
    state.initResolve(true);
    state.initResolve = null;
    state.initPromise = null;
  }
  requestPatchInfo({ skipInit: true });
  if (state.pendingPatchDump) {
    state.pendingPatchDump = false;
    requestCurrentPatchDump();
  }
}

async function requestPatchInfo({ skipInit = false } = {}) {
  const options = { requireInit: !skipInit };
  if (!state.currentPatchName) {
    elements.patchName.textContent = '讀取中...';
  }
  await sendSysex(normalizeTemplate(patchCountTemplate), 'Get Patch Count', options);
  await sendSysex(normalizeTemplate(patchInfoTemplate), 'Get Bank Info', options);
  await sendSysex(normalizeTemplate(currentBankTemplate), 'Get Current Patch', options);
}

function requestCurrentPatchDump() {
  if (!state.output) return;
  if (!state.initialized) {
    state.pendingPatchDump = true;
    sendInit(false);
    return;
  }
  const now = Date.now();
  if (now - state.lastPatchDumpRequest < 500) return;
  state.lastPatchDumpRequest = now;
  sendSysexRaw(buildInitMessage(), 'Get Current Patch');
}

function handlePatchCountMessage(bytes) {
  const count = readUInt16LE(bytes, 5);
  const length = readUInt16LE(bytes, 7);
  if (count !== null) state.patchCount = count;
  if (length !== null) state.patchLength = length;
  updatePatchUI();
}

function handlePatchInfoMessage(bytes) {
  const count = readUInt16LE(bytes, 5);
  const length = readUInt16LE(bytes, 7);
  const count2 = readUInt16LE(bytes, 9);
  const banks = readUInt16LE(bytes, 11);
  const perBank = readUInt16LE(bytes, 13);

  if (count !== null) state.patchCount = count;
  if (length !== null) state.patchLength = length;
  if (count2 !== null && !state.patchCount) state.patchCount = count2;
  if (banks !== null && banks !== 0) state.bankCount = banks;
  if (perBank !== null && perBank !== 0) state.patchesPerBank = perBank;
  updatePatchUI();
}

function handlePatchDump(bytes) {
  if (!state.initialized) {
    finalizeInit();
  }
  const offset = bytes[4] === 0x28 ? 5 : 9;
  const eightBitData = seven2eight(bytes, offset, bytes.length - 2);
  let parsed = eightBitData ? parsePTCFPatch(eightBitData) : null;
  if (!parsed && eightBitData) {
    const fallback = parsePatchFromChunks(eightBitData);
    if (fallback) {
      parsed = {
        version: null,
        target: null,
        shortName: null,
        name: fallback.name,
        effectIds: [],
        effectSettings: fallback.effectSettings,
      };
    }
  }
  if (!parsed && eightBitData) {
    const msog = parseMSOGPatch(eightBitData);
    if (msog) {
      parsed = {
        version: null,
        target: null,
        shortName: null,
        name: msog.name,
        effectIds: [],
        effectSettings: msog.effectSettings,
      };
    }
  }
  if (parsed) {
    state.currentPatchName = parsed.name || parsed.shortName || null;
    if (parsed.name && parsed.version === null && parsed.target === null) {
      state.patchNameSource = 'chunk';
    } else {
      state.patchNameSource = parsed.name ? 'ptcf' : 'ptcf-short';
    }
    let ids = Array.isArray(parsed.effectIds) ? Array.from(parsed.effectIds) : [];
    if ((!ids || ids.length === 0) && Array.isArray(parsed.effectSettings)) {
      ids = parsed.effectSettings.map((setting) => setting.id ?? 0);
    }
    while (ids.length < 6) ids.push(0);
    state.effectIds = ids;
    const settings = Array.isArray(parsed.effectSettings) ? parsed.effectSettings : [];
    state.effectParams = [];
    state.effectEnabled = [];
    settings.forEach((setting, index) => {
      state.effectEnabled[index] = Boolean(setting.enabled);
      state.effectParams[index] = Array.isArray(setting.parameters) ? setting.parameters : [];
    });
    if (state.currentPatchName) {
      logLine(`Patch 已同步：${state.currentPatchName}`);
    }
    if (settings.length) {
      const selectedSlot = getDeviceSlotFromInput();
      if (selectedSlot !== null && state.effectEnabled[selectedSlot] !== undefined) {
        state.effectToggle = state.effectEnabled[selectedSlot];
        updateEffectValue();
      }
    }
    updatePatchUI();
    return;
  }
  const payload = bytes.slice(6, -1);
  const name = extractPatchNameFromDump(payload);
  if (name) {
    state.currentPatchName = name;
    state.patchNameSource = 'heuristic';
    updatePatchUI();
  }
}

function handleSysexMessage(bytes) {
  if (bytes.length < 6) return;
  if (bytes[1] !== 0x52 || bytes[2] !== 0x00) return;
  autoSetDeviceId(bytes[3]);
  const type = bytes[4];
  if (type === 0x06) {
    handlePatchCountMessage(bytes);
  } else if (type === 0x43) {
    handlePatchInfoMessage(bytes);
  } else if (type === 0x28 || (type === 0x64 && bytes[5] === 0x12)) {
    handlePatchDump(bytes);
  } else if (type === 0x64 && bytes[5] === 0x26 && bytes[6] === 0x00 && bytes[7] === 0x00) {
    const bank = bytes[8] + (bytes[9] << 7);
    const program = bytes[10] + (bytes[11] << 7);
    state.currentBank = bank;
    state.currentProgram = program;
    updatePatchUI();
    scheduleMemorySlotSync();
  } else if (type === 0x64 && bytes[5] === 0x20) {
    const subtype = bytes[6];
    if (subtype === 0x01 && bytes.length >= 11) {
      const effectSlot = bytes[7];
      const paramNumber = bytes[8];
      const paramValue = bytes[9] + (bytes[10] << 7);
      applyParameterUpdate(effectSlot, paramNumber, paramValue, 'ACK');
    } else if (
      subtype === 0x00 &&
      bytes.length >= 10 &&
      bytes[7] === 0x64 &&
      bytes[8] === 0x01
    ) {
      const effectSlot = bytes[9];
      applyEffectSlotChange(effectSlot);
    } else if (subtype === 0x00 && bytes.length >= 11) {
      const effectSlot = bytes[7];
      const paramNumber = bytes[8];
      const paramValue = bytes[9] + (bytes[10] << 7);
      applyParameterUpdate(effectSlot, paramNumber, paramValue, 'EDIT');
    } else if (subtype === 0x00 && bytes.length >= 10 && bytes[7] === 0x5f) {
      if (state.nameUpdateTimer) {
        clearTimeout(state.nameUpdateTimer);
      }
      state.nameUpdateTimer = setTimeout(() => {
        requestCurrentPatchDump();
      }, 250);
    }
  } else if (type === 0x31 && bytes.length >= 9) {
    const effectSlot = bytes[5];
    const paramNumber = bytes[6];
    const paramValue = bytes[7] + (bytes[8] << 7);
    applyParameterUpdate(effectSlot, paramNumber, paramValue, 'EDIT');
  }
}

function updateCurrentPatchPosition() {
  if (state.bankMsb === null && state.bankLsb === null && state.currentProgram === null) {
    return;
  }
  const msb = state.bankMsb ?? 0;
  const lsb = state.bankLsb ?? 0;
  state.currentBank = (msb << 7) + lsb;
  updatePatchUI();
  scheduleMemorySlotSync();
}

function scheduleMemorySlotSync() {
  if (state.currentBank === null || state.currentProgram === null) return;
  if (!state.patchesPerBank) {
    scheduleFullSync('Patch 切換');
    return;
  }
  const slot = state.currentBank * state.patchesPerBank + state.currentProgram;
  if (state.lastMemorySlot !== slot) {
    state.lastMemorySlot = slot;
    scheduleFullSync('Patch 切換');
  }
}

function handleChannelMessage(bytes) {
  const status = bytes[0] & 0xf0;
  if (status === 0xb0 && bytes.length >= 3) {
    const cc = bytes[1];
    const value = bytes[2];
    if (cc === 0x00) {
      state.bankMsb = value;
      updateCurrentPatchPosition();
    } else if (cc === 0x20) {
      state.bankLsb = value;
      updateCurrentPatchPosition();
    }
  } else if (status === 0xc0 && bytes.length >= 2) {
    state.currentProgram = bytes[1];
    updateCurrentPatchPosition();
    scheduleFullSync('Patch 切換');
  }
}

function handleMidiMessage(event) {
  const data = Array.from(event.data || []);
  if (!data.length) return;
  if (data[0] === 0xf0) {
    handleSysexMessage(data);
  } else {
    handleChannelMessage(data);
  }
  logLine(`收到: ${bytesToHex(data)}`);
}

function handleParamSend() {
  const slot = getDeviceSlotFromInput();
  const param = Number(elements.paramNumber.value);
  const value = Number(elements.paramValue.value);
  if (slot === null || Number.isNaN(param) || Number.isNaN(value)) {
    logLine('參數數值不正確。', 'error');
    return;
  }
  const message = buildParameterMessage(slot, param, value);
  sendSysex(message, '參數更新');
}

function handleToggleEffect() {
  const slot = getDeviceSlotFromInput();
  if (slot === null) {
    logLine('Effect Slot 不正確。', 'error');
    return;
  }
  state.effectToggle = !state.effectToggle;
  const message = buildEffectToggle(slot, state.effectToggle);
  updateEffectValue();
  sendSysex(message, `效果${state.effectToggle ? '啟用' : '停用'}`);
}

function normalizeOscArgs(args) {
  if (!Array.isArray(args)) return [];
  return args.map((arg) => (arg && typeof arg === 'object' && 'value' in arg ? arg.value : arg));
}

function normalizeOscSlot(value) {
  const slot = Number(value);
  if (Number.isNaN(slot)) return null;
  if (slot >= 1 && slot <= 6) return slot - 1;
  if (slot >= 0 && slot <= 5) return slot;
  return null;
}

function handleOscPatchSet(args) {
  if (!state.output) {
    logLine('OSC：尚未連線 MIDI，忽略 Patch 切換。', 'warn');
    return;
  }
  if (!args.length) return;
  const bankArg = Number(args[0]);
  const programArg = Number(args[1]);
  const channelArg = Number(args[2] ?? 0);

  if (!Number.isNaN(bankArg) && !Number.isNaN(programArg)) {
    if (bankArg < 0 || programArg < 1) {
      logLine('OSC：Bank 需 >= 0，Program 需從 1 開始。', 'warn');
      return;
    }
    const program = programArg - 1;
    logLine(`OSC Patch：bank ${bankArg} / program ${programArg} → program ${program}`);
    sendProgramChange(bankArg, program, channelArg);
    return;
  }

  if (Number.isNaN(bankArg)) {
    logLine('OSC：Patch 參數無效。', 'warn');
    return;
  }

  if (bankArg < 0) {
    logLine('OSC：Patch 編號需 >= 0。', 'warn');
    return;
  }
  const absolute = bankArg;
  if (state.patchesPerBank) {
    const bank = Math.floor(absolute / state.patchesPerBank);
    const program = absolute % state.patchesPerBank;
    logLine(`OSC Patch：#${bankArg} → bank ${bank} / program ${program}`);
    sendProgramChange(Math.max(0, bank), Math.max(0, program), channelArg);
  } else {
    logLine('OSC：需要 Patch 資訊才可使用絕對編號。', 'warn');
  }
}

function handleOscPatchStep(step) {
  if (state.currentBank === null || state.currentProgram === null || !state.patchesPerBank) {
    logLine('OSC：尚未取得 Patch 資訊，無法切換。', 'warn');
    return;
  }
  const total = state.patchCount || state.patchesPerBank * (state.bankCount || 1);
  const current = state.currentBank * state.patchesPerBank + state.currentProgram;
  const next = (current + step + total) % total;
  const bank = Math.floor(next / state.patchesPerBank);
  const program = next % state.patchesPerBank;
  sendProgramChange(bank, program, 0);
}

function handleOscEffectToggle(args) {
  const slot = normalizeOscSlot(args[0]);
  if (slot === null) {
    logLine('OSC：效果槽位無效。', 'warn');
    return;
  }
  const enabledArg = args.length > 1 ? Number(args[1]) : null;
  const enabled = enabledArg === null || Number.isNaN(enabledArg) ? !state.effectEnabled[slot] : enabledArg > 0;
  const message = buildEffectToggle(slot, enabled);
  state.effectEnabled[slot] = enabled;
  if (getDeviceSlotFromInput() === slot) {
    state.effectToggle = enabled;
    updateEffectValue();
  }
  sendSysex(message, `OSC 效果${enabled ? '啟用' : '停用'}`);
}

function handleOscParam(args, normalized = false) {
  const slot = normalizeOscSlot(args[0]);
  const param = Number(args[1]);
  if (slot === null || Number.isNaN(param)) {
    logLine('OSC：參數格式無效。', 'warn');
    return;
  }
  let value = Number(args[2]);
  if (Number.isNaN(value)) {
    logLine('OSC：參數數值無效。', 'warn');
    return;
  }
  if (normalized) {
    const def = getParamDefinition(slot, param);
    let maxValue = def?.max;
    if (maxValue === undefined && Array.isArray(def?.values)) {
      maxValue = def.values.length - 1;
    }
    if (maxValue === undefined || Number.isNaN(maxValue)) {
      maxValue = 16383;
    }
    value = Math.round(Math.min(1, Math.max(0, value)) * maxValue);
  }
  const message = buildParameterMessage(slot, param, Math.max(0, value));
  sendSysex(message, 'OSC 參數更新');
}

function handleOscMessage(message) {
  if (!message || typeof message.address !== 'string') return;
  const args = normalizeOscArgs(message.args);
  switch (message.address) {
    case '/zoom/patch':
    case '/zoom/patch/set':
      handleOscPatchSet(args);
      break;
    case '/zoom/patch/next':
      handleOscPatchStep(1);
      break;
    case '/zoom/patch/prev':
      handleOscPatchStep(-1);
      break;
    case '/zoom/effect/toggle':
      handleOscEffectToggle(args);
      break;
    case '/zoom/effect/param':
      handleOscParam(args, false);
      break;
    case '/zoom/effect/param_norm':
      handleOscParam(args, true);
      break;
    default:
      logLine(`OSC：未知指令 ${message.address}`, 'warn');
  }
}

function setupOscBridge() {
  if (!window.osc || typeof window.osc.onMessage !== 'function') {
    logLine('OSC：Bridge 未啟用', 'warn');
    return;
  }
  window.osc.onMessage(handleOscMessage);
  logLine('OSC Bridge 已啟用 (預設 UDP 9000)');
}

function populateQuickCommands() {
  elements.quickCommands.innerHTML = '';
  quickCommandTemplates.forEach((command) => {
    const card = document.createElement('div');
    card.className = 'command-card';
    const title = document.createElement('h4');
    title.textContent = command.name;
    const desc = document.createElement('p');
    desc.textContent = command.description;
    const button = document.createElement('button');
    button.className = 'ghost';
    button.textContent = '送出';
    button.addEventListener('click', () => sendQuickCommand(command.template, command.name));
    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(button);
    elements.quickCommands.appendChild(card);
  });
}

function setupMidiListeners() {
  if (!state.midiAccess) return;
  state.midiAccess.onstatechange = () => {
    refreshDevices();
  };
}

function refreshDevices({ preserveSelection = true, reset = true } = {}) {
  if (!state.midiAccess) return;
  const outputs = Array.from(state.midiAccess.outputs.values());
  const inputs = Array.from(state.midiAccess.inputs.values());
  const prevOutputId = preserveSelection ? elements.outputSelect.value : null;
  const prevInputId = preserveSelection ? elements.inputSelect.value : null;

  elements.outputSelect.innerHTML = '';
  outputs.forEach((output) => {
    const option = document.createElement('option');
    option.value = output.id;
    option.textContent = output.name || output.id;
    elements.outputSelect.appendChild(option);
  });

  elements.inputSelect.innerHTML = '';
  inputs.forEach((input) => {
    const option = document.createElement('option');
    option.value = input.id;
    option.textContent = input.name || input.id;
    elements.inputSelect.appendChild(option);
  });

  if (outputs.length) {
    const selectedOutput = outputs.find((output) => output.id === prevOutputId) || outputs[0];
    state.output = selectedOutput;
    elements.outputSelect.value = selectedOutput.id;
  } else {
    state.output = null;
  }

  if (inputs.length) {
    const selectedInput = inputs.find((input) => input.id === prevInputId) || inputs[0];
    state.input = selectedInput;
    elements.inputSelect.value = selectedInput.id;
    attachInputListener(state.input);
  } else {
    state.input = null;
  }

  if (reset) {
    resetInitialization();
  }
  logLine(`找到 ${outputs.length} 個輸出 / ${inputs.length} 個輸入裝置`);
}

function attachInputListener(input) {
  if (!input) return;
  input.onmidimessage = handleMidiMessage;
}

async function openMidiPort(port, label) {
  if (!port || typeof port.open !== 'function') return;
  try {
    await port.open();
    logLine(`已開啟 ${label}: ${port.name || port.id}`);
  } catch (error) {
    logLine(`開啟 ${label} 失敗：${error.message}`, 'warn');
  }
}

async function preloadMidiPorts() {
  if (!navigator.requestMIDIAccess) return;
  try {
    if (state.midiAccess) return;
    const access = await navigator.requestMIDIAccess({ sysex: true });
    state.midiAccess = access;
    updateSysexStatus();
    setupMidiListeners();
    refreshDevices({ preserveSelection: true, reset: false });
  } catch (error) {
    logLine(`預先讀取 MIDI (SysEx) 失敗: ${error.message}`, 'warn');
    try {
      const access = await navigator.requestMIDIAccess({ sysex: false });
      if (!state.midiAccess) {
        state.midiAccess = access;
      }
      updateSysexStatus();
      setupMidiListeners();
      refreshDevices({ preserveSelection: true, reset: false });
    } catch (innerError) {
      logLine(`預先讀取 MIDI 失敗: ${innerError.message}`, 'warn');
    }
  }
}

async function connectMidi() {
  try {
    if (!navigator.requestMIDIAccess) {
      logLine('此環境不支援 Web MIDI。請確認 Electron 已啟用 Web MIDI。', 'error');
      return;
    }
    const prevOutputId = elements.outputSelect.value;
    const prevInputId = elements.inputSelect.value;
    let access = state.midiAccess;
    if (!access || !access.sysexEnabled) {
      try {
        access = await navigator.requestMIDIAccess({ sysex: true });
      } catch (error) {
        logLine(`無法取得 SysEx 權限：${error.message}`, 'error');
        if (!access) return;
      }
    }
    state.midiAccess = access;
    updateSysexStatus();
    resetInitialization();
    setupMidiListeners();
    refreshDevices({ preserveSelection: true, reset: true });
    if (prevOutputId) elements.outputSelect.value = prevOutputId;
    if (prevInputId) elements.inputSelect.value = prevInputId;
    handleOutputChange();
    handleInputChange();
    await Promise.all([
      openMidiPort(state.output, 'MIDI 輸出'),
      openMidiPort(state.input, 'MIDI 輸入'),
    ]);
    logLine('Web MIDI 連線成功');
    if (state.output) {
      setTimeout(() => {
        sendSysexRaw(normalizeTemplate(patchCountTemplate), 'Get Patch Count');
        sendInit(false);
        sendSysexRaw(normalizeTemplate(paramEditEnableTemplate), 'Param Edit Enable');
      }, 150);
    }
  } catch (error) {
    logLine(`Web MIDI 連線失敗: ${error.message}`, 'error');
  }
}

function handleOutputChange() {
  if (!state.midiAccess) return;
  const output = state.midiAccess.outputs.get(elements.outputSelect.value);
  state.output = output || null;
  if (output) {
    resetInitialization('已切換 MIDI 輸出，請重新初始化。');
    logLine(`已選擇輸出: ${output.name || output.id}`);
  }
}

function handleInputChange() {
  if (!state.midiAccess) return;
  const input = state.midiAccess.inputs.get(elements.inputSelect.value);
  state.input = input || null;
  if (input) {
    attachInputListener(input);
    logLine(`已選擇輸入: ${input.name || input.id}`);
  }
}

function setupEvents() {
  elements.connect.addEventListener('click', connectMidi);
  elements.refresh.addEventListener('click', refreshDevices);
  elements.initDevice.addEventListener('click', () => {
    sendInit(true);
  });
  if (elements.syncPatch) {
    elements.syncPatch.addEventListener('click', () => {
      requestPatchInfo();
    });
  }
  elements.outputSelect.addEventListener('change', handleOutputChange);
  elements.inputSelect.addEventListener('change', handleInputChange);
  elements.deviceId.addEventListener('change', setDeviceId);
  elements.effectSlot.addEventListener('input', () => {
    updateEffectNameUI();
    updateParamOptions();
  });
  elements.paramNumber.addEventListener('change', () => {
    elements.paramNumber.dataset.selectedIndex = elements.paramNumber.value;
    updateParamRange(getCurrentParam());
    syncParamValueFromState();
  });
  elements.paramValue.addEventListener('input', () => {
    updateParamValueReadout();
  });
  elements.sendParam.addEventListener('click', handleParamSend);
  elements.toggleEffect.addEventListener('click', handleToggleEffect);
}

function init() {
  populateQuickCommands();
  setupEvents();
  updateSysexStatus();
  updateInitStatus();
  updateEffectValue();
  updatePatchUI();
  loadEffectMappings();
  preloadMidiPorts();
  setupOscBridge();
}

window.addEventListener('error', (event) => {
  logLine(`JS 錯誤：${event.message}`, 'error');
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason?.message || String(event.reason || '未知錯誤');
  logLine(`Promise 錯誤：${reason}`, 'error');
});

init();
