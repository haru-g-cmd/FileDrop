declare module 'spark-md5' {
  class SparkMD5 {
    append(str: string): SparkMD5;
    end(raw?: boolean): string;
    reset(): SparkMD5;
    static hash(str: string, raw?: boolean): string;
    static hashBinary(content: string, raw?: boolean): string;
  }

  namespace SparkMD5 {
    class ArrayBuffer {
      append(arr: globalThis.ArrayBuffer): ArrayBuffer;
      end(raw?: boolean): string;
      reset(): ArrayBuffer;
      static hash(arr: globalThis.ArrayBuffer, raw?: boolean): string;
    }
  }

  export = SparkMD5;
}
