import {
  BufferAttribute,
  BufferGeometry,
  EllipseCurve,
  FileLoader,
  Float32BufferAttribute,
  Group,
  Line,
  LineBasicMaterial,
  Loader,
  LoaderUtils,
  LoadingManager,
  Points,
  PointsMaterial,
  Vector2,
  Vector3,
} from "three";

class IGESLoader extends Loader {
  constructor(manager?: LoadingManager) {
    super(manager);
  }

  load(
    url: string,
    onLoad: (iges: any) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (err: unknown) => void
  ) {
    const scope = this;

    const path = this.path === "" ? LoaderUtils.extractUrlBase(url) : this.path;

    let loader = new FileLoader(this.manager);
    loader.setPath(this.path);
    loader.setResponseType("text");

    loader.load(
      url,
      function (text) {
        try {
          if (text instanceof ArrayBuffer) {
            return new ErrorEvent("WrongType");
          }
          onLoad(scope.parse(text, path));
        } catch (e) {
          console.error(e);
          scope.manager.itemError(url);
        }
      },
      onProgress,
      onError
    );
  }

  parse(data: string, path: string) {
    var Entity = function (
      this: any,
      attribute = { entityType: "" },
      params = []
    ) {
      this.type = attribute.entityType;
      this.attr = attribute;
      this.params = params;
    };

    function IGES(this: any) {
      this.fieldDelimiter = ","; // as default
      this.termDelimiter = ";"; // as default
      this.entities = new Array();
      return this;
    }

    IGES.prototype.parseStart = function (data: string) {
      this.comment = data;
    };

    IGES.prototype.parseGlobal = function (data: string) {
      if (data[0] != ",") {
        this.fieldDelimiter = parseIgesString(data);
      }
      var fields = data.split(this.fieldDelimiter);
      if (data[0] != ",") {
        fields.splice(0, 1);
      }

      this.termDelimiter = parseIgesString(fields[1]) || ";";
      this.exportID = parseIgesString(fields[2]);
      this.fileName = parseIgesString(fields[3]);
      this.systemID = parseIgesString(fields[4]);
      this.translateVer = parseIgesString(fields[5]);
      this.integerBits = fields[6];
      this.singleExpBits = fields[7];
      this.singleMantissaBits = fields[8];
      this.doubleExpBits = fields[9];
      this.doubleMantissaBits = fields[10];
      this.receiveID = parseIgesString(fields[11]);
      this.scale = fields[12];
      this.unitFlag = fields[13];
      this.unit = parseIgesString(fields[14]);
      this.maxStep = fields[15];
      this.maxWidth = fields[16];
      this.createDate = parseIgesString(fields[17]);
      this.resolution = fields[18];
      this.maxValue = fields[19];
      this.createUser = parseIgesString(fields[20]);
      this.createOrg = parseIgesString(fields[21]);
      this.igesVer = fields[22];
      this.formatCode = fields[23];
      this.lastModifiedDate = parseIgesString(fields[24]);
    };

    IGES.prototype.parseDirection = function (data: string) {
      for (var i = 0; i < data.length; i += 160) {
        var entity = new (Entity as any)();
        var attr = entity.attr;
        var item = data.substr(i, 160);
        attr.entityType = parseInt(item.substr(0, 8));
        attr.entityIndex = parseInt(item.substr(8, 8));
        attr.igesVersion = parseInt(item.substr(16, 8));
        attr.lineType = parseInt(item.substr(24, 8));
        attr.level = parseInt(item.substr(32, 8));
        attr.view = parseInt(item.substr(40, 8));
        attr.transMatrix = parseInt(item.substr(48, 8));
        attr.labelDisp = parseInt(item.substr(56, 8));
        attr.status = item.substr(64, 8);
        attr.sequenceNumber = parseInt(item.substr(73, 7));

        attr.lineWidth = parseInt(item.substr(88, 8));
        attr.color = parseInt(item.substr(96, 8));
        attr.paramLine = parseInt(item.substr(104, 8));
        attr.formNumber = parseInt(item.substr(112, 8));

        attr.entityName = item.substr(136, 8).trim();
        attr.entitySub = parseInt(item.substr(144, 8));

        this.entities.push(entity);
      }
    };

    IGES.prototype.parseParameter = function (data: string) {
      var rawParams = data.split(";");
      rawParams.pop();
      var params = rawParams.map(function (item) {
        return item.split(",");
      });
      var entity;
      for (var i = 0; i < params.length; i++) {
        entity = this.entities[i];
        var param = params[i];
        if (param) {
          entity.type = param.shift();
          entity.params = param.map(parseIgesFloat);
        }
      }
    };

    IGES.prototype.parseTerminate = function (data: string) {
      this.lineNum_S = parseInt(data.substr(1, 7));
      this.lineNum_G = parseInt(data.substr(9, 7));
      this.lineNum_D = parseInt(data.substr(17, 7));
      this.lineNum_P = parseInt(data.substr(25, 7));

      if (this.entities.length != this.lineNum_D / 2)
        throw new Error("ERROR: Inconsistent");
    };

    function parseIges(data: string) {
      var geometry = new Group(); // []; // new BufferGeometry();
      geometry.name = "Group_" + Math.floor(Math.random() * 10000000);

      var iges = Object.create(IGES.prototype);

      var lines = data.split("\n").filter(function (item) {
        return item != "";
      });
      var currentSection = "";
      var startSec = "",
        globalSec = "",
        dirSec = "",
        paramSec = "",
        terminateSec = "";
      var line = "";
      for (var i = 0; i < lines.length; i++) {
        line = lines[i] || "";
        currentSection = line[72] || ""; //72
        line = line.substr(0, 80); //0,72
        switch (currentSection) {
          case "S": {
            startSec += line.substr(0, 72).trim();
            break;
          }
          case "G": {
            globalSec += line.substr(0, 72).trim();
            break;
          }
          case "D": {
            dirSec += line;
            break;
          }
          case "P": {
            paramSec += line.substr(0, 64).trim();
            break;
          }
          case "T": {
            terminateSec += line.substr(0, 72).trim();
            break;
          }
          default:
            throw new TypeError("ERROR: Unknown IGES section type");
        }
      }
      iges.parseStart(startSec);
      iges.parseGlobal(globalSec);
      iges.parseDirection(dirSec);
      iges.parseParameter(paramSec);
      iges.parseTerminate(terminateSec);

      var entities = iges.entities;

      var vertices = [];
      var groupCount = 0;
      var startVertex = 0;
      var endVertex = 0;

      var entity;
      for (var i = 0; i < entities.length; i++) {
        entity = entities[i];
        switch (entity.type) {
          case "100":
            drawCArc(entity);
            break;
          case "102":
            drawCCurve(entity);
            break;
          case "106":
            drawPath(entity);
            break;
          case "108":
            drawPlane(entity);
            break;
          case "110":
            drawLine(entity);
            break;
          case "116":
            drawPoint(entity);
            break;
          case "120":
            drawRSurface(entity);
            break;
          case "122":
            drawTCylinder(entity);
            break;
          case "124":
            drawTransMatrix(entity);
            break;
          case "126":
            drawRBSplineCurve(entity);
            break;
          case "128":
            drawRBSplineSurface(entity);
            break;
          case "142":
            drawCurveOnPSurface(entity);
            break;
          case "144":
            drawTPSurface(entity);
            break;
          case "212":
            drawGeneralNote(entity);
            break;
          case "214":
            drawLeaderArrow(entity);
            break;
          case "216":
            drawLinearDimension(entity);
            break;
          case "314":
            drawColor(entity);
            break;
          case "402":
            drawAInstance(entity);
            break;
          case "406":
            propertyEntity(entity);
            break;
          default:
            console.log("Uncompliment entity type", entity.type);
        }
      }

      function getBySequence(arr: any, sequence: any) {
        for (var i = 0, iLen = arr.length; i < iLen; i++) {
          if (arr[i].attr.sequenceNumber == sequence) return arr[i];
        }
      }

      /*
       *	CIRCULAR ARC ENTITY (TYPE 100)
       *
       * 	Parameter Data
       *
       *	Index 	Name 	Type 	Description
       *	1 		ZT 		Real 	Parallel ZT displacement of arc from XT ; YT plane
       *	2 		X1 		Real 	Arc center abscissa
       *	3 		Y1 		Real 	Arc center ordinate
       *	4 		X2 		Real 	Start point abscissa
       *	5 		Y2 		Real 	Start point ordinate
       *	6 		X3 		Real 	Terminate point abscissa
       *	7 		Y3 		Real 	Terminate point ordinate
       */
      function drawCArc(entity: any) {
        var entityAttr = entity.attr;

        var entityParams = entity.params;

        const startVector = new Vector2(
          entityParams[3] - entityParams[1],
          entityParams[4] - entityParams[2]
        );
        const endVector = new Vector2(
          entityParams[5] - entityParams[1],
          entityParams[6] - entityParams[2]
        );

        const startAngle = startVector.angle();
        const endAngle = endVector.angle();

        const curve = new EllipseCurve(
          entityParams[1],
          entityParams[2], // ax, aY
          1,
          1, // xRadius, yRadius
          startAngle,
          endAngle, // aStartAngle, aEndAngle
          false, // aClockwise
          0 // aRotation
        );
      }
    }

    function parseIgesFloat(p: string) {
      return parseFloat(p.replace(/D/g, "e"));
    }

    function parseIgesString(str: string | null | undefined) {
      try {
        if (str === null || str === undefined) return "";
        var d = str.indexOf("H");
        if (d == -1) return null;
        var digit = str.substring(0, d);
        var value = str.substring(d + 1, d + 1 + parseInt(digit, 10));
        return value;
      } catch (e) {
        console.error(e);
        return "";
      }
    }

    return parseIges(data);
  }
}

export { IGESLoader };

function drawCCurve(entity: any) {
  throw new Error("Function not implemented.");
}

function drawPath(entity: any) {
  throw new Error("Function not implemented.");
}

function drawPlane(entity: any) {
  throw new Error("Function not implemented.");
}

function drawPoint(entity: any) {
  throw new Error("Function not implemented.");
}

function drawRSurface(entity: any) {
  throw new Error("Function not implemented.");
}

function drawTCylinder(entity: any) {
  throw new Error("Function not implemented.");
}

function drawTransMatrix(entity: any) {
  throw new Error("Function not implemented.");
}

function drawRBSplineCurve(entity: any) {
  throw new Error("Function not implemented.");
}

function drawRBSplineSurface(entity: any) {
  throw new Error("Function not implemented.");
}

function drawCurveOnPSurface(entity: any) {
  throw new Error("Function not implemented.");
}

function drawGeneralNote(entity: any) {
  throw new Error("Function not implemented.");
}

function drawLeaderArrow(entity: any) {
  throw new Error("Function not implemented.");
}

function drawLinearDimension(entity: any) {
  throw new Error("Function not implemented.");
}

function drawColor(entity: any) {
  throw new Error("Function not implemented.");
}

function drawAInstance(entity: any) {
  throw new Error("Function not implemented.");
}

function propertyEntity(entity: any) {
  throw new Error("Function not implemented.");
}

function drawLine(entity: any) {
  throw new Error("Function not implemented.");
}

function drawTPSurface(entity: any) {
  throw new Error("Function not implemented.");
}

// type IgesData = {
//   fileName: string;
//   directoryEntries: Array<string>;
//   global: Array<string>;
//   start: Array<string>;
//   terminate: Array<string>;
//   parameterData: Array<string>;
// };

// // Fixed format sections:
// // S - Start
// // G - Global
// // D - Directory Entry
// // P - Parameter Data
// // T - Terminate
// type FixedFormatSections = "S" | "G" | "D" | "P" | "T";
// type CompressedFormatSections = "C" | "S" | "G" | null | "T";

// const igesMap = (text: string) => {
//   const map = new Map<FixedFormatSections, Array<string>>();
//   map.set("S", text.split(";"));
// };

// const loadIgesFile = async (file: File): Promise<IgesData> => {
//   const test: IgesData = {
//     fileName: "",
//     directoryEntries: [],
//     global: [],
//     start: [],
//     terminate: [],
//     parameterData: [],
//   };
//   return test;
// };
