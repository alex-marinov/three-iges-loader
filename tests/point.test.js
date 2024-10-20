import fs from "fs";
import { IGESLoader } from "../src/IGESLoader";
import * as THREE from "three";

describe("IGESLoader", () => {
  it("should parse a point", () => {
    const loader = new IGESLoader();
    expect(loader).toBeInstanceOf(IGESLoader);

    const filePath = "tests/models/point.iges";
    const data = fs.readFileSync(filePath, "utf8");

    let test = loader.parse(data);
    let points = test.children[0];
    expect(points).toBeInstanceOf(THREE.Points);

    let pointBufferGeometry = points.geometry;
    expect(pointBufferGeometry).toBeInstanceOf(THREE.BufferGeometry);

    let pointVertice = pointBufferGeometry;
    let pointVertice_x = pointVertice.attributes.position.array[0];
    let pointVertice_y = pointVertice.attributes.position.array[1];
    let pointVertice_z = pointVertice.attributes.position.array[2];
    expect(pointVertice_x).toBe(10);
    expect(pointVertice_y).toBe(20);
    expect(pointVertice_z).toBe(30);
  });
});
