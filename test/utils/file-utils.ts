import { resolve } from "path";
import { readFileSync } from 'fs';

export function readJsonData(name: string) : any
{
    const filePath = resolve(__dirname, '..', 'data', name);
    const contents = readFileSync(filePath).toString();
    const json = JSON.parse(contents);
    return json;
}