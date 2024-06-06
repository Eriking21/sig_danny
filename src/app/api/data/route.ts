"use server";
import lockfile from "proper-lockfile";
import fs, { promises as fs2 } from "fs";
import { ClientContent } from "@/AddingForm/getPostContent";
import { NextRequest, NextResponse } from "next/server";
import { Pils_Info, erimServerData, erim_vec } from "./types";
import { triggerRefresh } from "./refresh/route";

export async function getData(): Promise<erimServerData> {
  "use server";
  let sources: erimServerData["sources"] = JSON.parse(
    await fs2.readFile(`./data/Pils_Sources.json`, { encoding: "utf8" })
  );
  console.log;
  const pils = [
    ...Object.keys(sources).map((k) => {
      const file = `./data/Pils${sources[parseInt(k)].attributes.FID}.json`;
      console.log(file);
      return fs.existsSync(file)
        ? fs2
            .readFile(file, { encoding: "utf8" })
            .then((content) => JSON.parse(content) as erim_vec<Pils_Info>)
        : Promise.resolve({} as erim_vec<Pils_Info>);
    }),
  ];

  return {
    sources: sources,
    pils: await Promise.all(pils),
  };
}

export async function GET(request: NextRequest) {
  "use server";
  return NextResponse.json(await getData());//(JSON.stringify());
}

export async function PUT(request: NextRequest) {
    "use server";
  const { info }: ClientContent = await request.json();
  let i = info.attributes.FID!;
  console.log("put:", info);

  let path = `./data/Pils${
    i < 1000 ? "_Sources" : Math.floor((i - 1000) / 1000)
  }.json`;

  console.log({ info, path,i });
  i %= 1000;

  if (fs.existsSync(path)) {
    await lockfile.lock("./data/index.json").catch(onlockError);
    let list: (typeof info)[] = JSON.parse(await fs2.readFile(path, encoding));
    if (i < list.length) {
      list[i] = info;
      await fs2.writeFile(path, JSON.stringify(list));
      await lockfile.unlock("./data/index.json");
      triggerRefresh();
      return new NextResponse("ok");
    }
    await lockfile.unlock("./data/index.json");
  }

  return new NextResponse("failed");
}

export async function POST(request: NextRequest) {
    "use server";
  const { info, source }: ClientContent = await request.json();
  console.log({ info, source });

  console.log("post:", info);

  let file = "Pils";

  if (source === undefined) {
    info.attributes.FID = 0;
    file += "_Sources";
  } else if (source < 1000) {
    info.attributes.FID = 1000;
    file += source;
  } else {
    console.log("invalid data");
    return;
  }

  await lockfile.lock("./data/index.json").catch(onlockError);

  const max: { [key: string]: number } = JSON.parse(
    await fs2.readFile("./data/index.json", encoding)
  );

  max[file] ??= 0;
  info.attributes.FID += (source ?? 0) * 1000 + max[file]++;

  let list: ClientContent["info"][] = fs.existsSync(`./data/${file}.json`)
    ? JSON.parse(await fs2.readFile(`./data/${file}.json`, encoding))
    : [];

  list.push(info);

  await Promise.all([
    fs2.writeFile("./data/index.json", JSON.stringify(max)),
    fs2.writeFile(`./data/${file}.json`, JSON.stringify(list)),
  ]);

  await lockfile.unlock("./data/index.json");
  triggerRefresh();
  return new NextResponse("ok");
}

const encoding = { encoding: "utf8" as BufferEncoding };
const onlockError = (err: any) => {
  console.log("locking Error");
};
