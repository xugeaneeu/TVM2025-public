// UTF-8 encoding/decoding
export interface UTF8 {
    encode(text: string): Uint8Array
    decode(buf: ArrayBufferView | ArrayLike<number>): string
  }
  
  declare interface TextEncoder {
    new(encoding: string): TextEncoder
    encode(v: string, options?: {stream: boolean}): Uint8Array
  }
  declare var TextEncoder: TextEncoder
  
  declare interface TextDecoder {
    new(encoding: string): TextDecoder
    decode(v: ArrayBufferView, options?: {stream: boolean}): string
  }
  declare var TextDecoder: TextDecoder
  
  import { Buffer } from "buffer"
  
  // ——————————————————————————————————————————————————————————————————————————
  
  export const utf8 = typeof TextEncoder != 'undefined' ? (function(){
    // Modern browsers
    const enc = new TextEncoder('utf-8')
    const dec = new TextDecoder('utf-8')
    return {
  
    encode(text: string): Uint8Array {
      return enc.encode(text)
    },
  
    decode(b: ArrayBufferView|ArrayLike<number>): string {
      return dec.decode(
        (b as ArrayBufferView).buffer != undefined ? b as ArrayBufferView: 
        new Uint8Array(b as ArrayLike<number>)
      )
    },
  
  }})():  typeof Buffer != 'undefined' ? {
    // Nodejs
    encode(text: string): Uint8Array {
      return new Uint8Array(Buffer.from(text, 'utf-8'))
    },
  
    decode(b: ArrayBufferView<ArrayBuffer>|number[]): string {
      return (
        (b as ArrayBufferView<ArrayBuffer>).buffer != undefined ?
          Buffer.from(
            (b as ArrayBufferView<ArrayBuffer>).buffer,
            (b as ArrayBufferView).byteOffset,
            (b as ArrayBufferView).byteLength): 
          Buffer.from(b as number[])
      ).toString('utf8')
    }
  
  }:  {
    // Some other pesky JS environment
    encode(text: string): Uint8Array {
      let asciiBytes = []
      for (let i = 0, L = text.length; i != L; ++i) {
        asciiBytes[i] = 0xff & text.charCodeAt(i);
      }
      return new Uint8Array(asciiBytes)
    },
    decode(buf: ArrayBufferView): string {
      return ''
    }
  } as UTF8