import fs from "fs";
import { log } from "console";
import { IGESLoader } from "../src/IGESLoader";
import * as THREE from "three";

describe("IGESLoader", () => {
  it("loader should be type of IGESLoader", () => {
    const loader = new IGESLoader();
    expect(loader).toBeInstanceOf(IGESLoader);
  });
});
