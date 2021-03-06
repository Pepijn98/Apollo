export class StringBuilder {
    private static readonly regexNumber = /{(\d+(:\w*)?)}/g;
    private static readonly regexObject = /{(\w+(:\w*)?)}/g;

    public static Empty = "";

    public static IsNullOrWhiteSpace(value: string): boolean {
        try {
            if (value == null || value == "undefined") {
                return true;
            }
            return value.toString().replace(/\s/g, "").length < 1;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    public static Join(delimiter: string, ...args: (string | Record<string, unknown> | Array<any>)[]): string {
        try {
            const firstArg = args[0];
            if (Array.isArray(firstArg) || firstArg instanceof Array) {
                let tempString = StringBuilder.Empty;
                for (let i = 0; i < firstArg.length; i++) {
                    const current = firstArg[i];
                    if (i < firstArg.length - 1) {
                        tempString += current + delimiter;
                    } else {
                        tempString += current;
                    }
                }

                return tempString;
            } else if (typeof firstArg === "object") {
                let tempString = StringBuilder.Empty;
                const objectArg = firstArg;
                const keys = Object.keys(firstArg); // Get all Properties of the Object as Array
                keys.forEach((element) => {
                    tempString += objectArg[element] + delimiter;
                });
                tempString = tempString.slice(0, tempString.length - delimiter.length); // Remove last delimiter
                return tempString;
            }

            const stringArray = args as string[];

            return StringBuilder.join(delimiter, ...stringArray);
        } catch (e) {
            console.error(e);
            return StringBuilder.Empty;
        }
    }

    public static Format(format: string, ...args: any[]): string {
        try {
            if (format.match(StringBuilder.regexNumber)) {
                return StringBuilder.format(StringBuilder.regexNumber, format, args);
            }

            if (format.match(StringBuilder.regexObject)) {
                return StringBuilder.format(StringBuilder.regexObject, format, args, true);
            }

            return format;
        } catch (e) {
            console.error(e);
            return StringBuilder.Empty;
        }
    }

    private static format(regex: any, format: string, args: any, parseByObject = false): string {
        return format.replace(regex, function (match, x) {
            // 0
            const s = match.split(":");
            if (s.length > 1) {
                x = s[0].replace("{", "");
                match = s[1].replace("}", ""); // U
            }

            let arg;
            if (parseByObject) {
                arg = args[0][x];
            } else {
                arg = args[x];
            }

            if (arg == null || arg == undefined || match.match(/{\d+}/)) {
                return arg;
            }

            arg = StringBuilder.parsePattern(match, arg);
            return typeof arg != "undefined" && arg != null ? arg : StringBuilder.Empty;
        });
    }

    private static parsePattern(match: "L" | "U" | "d" | "s" | "n" | string, arg: string | Date | number | any): string {
        switch (match) {
            case "L": {
                arg = arg.toLowerCase();
                return arg;
            }
            case "U": {
                arg = arg.toUpperCase();
                return arg;
            }
            case "d": {
                if (typeof arg === "string") {
                    return StringBuilder.getDisplayDateFromString(arg);
                } else if (arg instanceof Date) {
                    return StringBuilder.Format("{0:00}.{1:00}.{2:0000}", arg.getDate(), arg.getMonth(), arg.getFullYear());
                }
                break;
            }
            case "s": {
                if (typeof arg === "string") {
                    return StringBuilder.getSortableDateFromString(arg);
                } else if (arg instanceof Date) {
                    return StringBuilder.Format("{0:0000}-{1:00}-{2:00}", arg.getFullYear(), arg.getMonth(), arg.getDate());
                }
                break;
            }
            case "n": {
                if (typeof arg !== "string") arg = arg.toString();
                const replacedString = arg.replace(/,/g, ".");
                if (isNaN(parseFloat(replacedString)) || replacedString.length <= 3) {
                    break;
                }

                const numberparts = replacedString.split(/[^0-9]+/g);
                let parts = numberparts;

                if (numberparts.length > 1) {
                    parts = [StringBuilder.join("", ...numberparts.splice(0, numberparts.length - 1)), numberparts[numberparts.length - 1]];
                }

                const integer = parts[0];

                const mod = integer.length % 3;
                let output = mod > 0 ? integer.substring(0, mod) : StringBuilder.Empty;
                const remainingGroups = integer.substring(mod).match(/.{3}/g);
                output = output + "." + StringBuilder.Join(".", remainingGroups);
                arg = output + (parts.length > 1 ? "," + parts[1] : "");
                return arg;
            }
            default: {
                break;
            }
        }

        if ((typeof arg === "number" || !isNaN(arg)) && !isNaN(+match) && !StringBuilder.IsNullOrWhiteSpace(arg)) {
            return StringBuilder.formatNumber(arg, match);
        }

        return arg;
    }

    private static getDisplayDateFromString(input: string): string {
        const splitted = input.split("-");

        if (splitted.length <= 1) {
            return input;
        }

        let day = splitted[splitted.length - 1];
        const month = splitted[splitted.length - 2];
        const year = splitted[splitted.length - 3];
        day = day.split("T")[0];
        day = day.split(" ")[0];

        return `${day}.${month}.${year}`;
    }

    private static getSortableDateFromString(input: string): string {
        const splitted = input.replace(",", "").split(".");
        if (splitted.length <= 1) {
            return input;
        }

        const times = splitted[splitted.length - 1].split(" ");
        let time = StringBuilder.Empty;
        if (times.length > 1) {
            time = times[times.length - 1];
        }

        const year = splitted[splitted.length - 1].split(" ")[0];
        const month = splitted[splitted.length - 2];
        const day = splitted[splitted.length - 3];
        let result = `${year}-${month}-${day}`;

        if (!StringBuilder.IsNullOrWhiteSpace(time) && time.length > 1) {
            result += `T${time}`;
        } else {
            result += "T00:00:00";
        }

        return result;
    }

    private static formatNumber(input: number, formatTemplate: string): string {
        const count = formatTemplate.length;
        const stringValue = input.toString();
        if (count <= stringValue.length) {
            return stringValue;
        }

        let remainingCount = count - stringValue.length;
        remainingCount += 1; // Array must have an extra entry

        return new Array(remainingCount).join("0") + stringValue;
    }

    private static join(delimiter: string, ...args: string[]): string {
        let temp = StringBuilder.Empty;
        for (let i = 0; i < args.length; i++) {
            if ((typeof args[i] == "string" && StringBuilder.IsNullOrWhiteSpace(args[i])) || (typeof args[i] != "number" && typeof args[i] != "string")) {
                continue;
            }

            const arg = "" + args[i];
            temp += arg;
            for (let i2 = i + 1; i2 < args.length; i2++) {
                if (StringBuilder.IsNullOrWhiteSpace(args[i2])) {
                    continue;
                }

                temp += delimiter;
                i = i2 - 1;
                break;
            }
        }

        return temp;
    }
}

export class Builder {
    Values: string[] = [];

    constructor(value: string = StringBuilder.Empty) {
        this.Values = new Array(value);
    }

    ToString(): string {
        return this.Values.join("");
    }

    Append(value: string): void {
        this.Values.push(value);
    }

    AppendFormat(format: string, ...args: any[]): void {
        this.Values.push(StringBuilder.Format(format, ...args));
    }

    Clear(): void {
        this.Values = [];
    }
}
