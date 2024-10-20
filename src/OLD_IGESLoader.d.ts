import { Loader, Group } from "three";

export class IGESLoader extends Loader {
  constructor(manager?: LoadingManager);

  load(
    url: string,
    onLoad: (iges: any) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (event: ErrorEvent) => void
  ): void;

  parse(data: ArrayBuffer | string): Group;
}
