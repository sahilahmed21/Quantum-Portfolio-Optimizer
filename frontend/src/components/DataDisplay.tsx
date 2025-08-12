// src/components/DataDisplay.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// --- HELPER FUNCTIONS ---

/**
 * Formats a number to a specified number of decimal places.
 * @param num The number to format.
 * @returns A string representation of the formatted number.
 */
const formatNumber = (num: number): string => {
    if (Math.abs(num) < 1e-4 && num !== 0) {
        return num.toExponential(2);
    }
    return num.toFixed(4);
};

// --- COMPONENTS ---

/**
 * Renders a vector (a 1D array of numbers) in a clean, horizontal format.
 */
export function VectorDisplay({ data, title }: { data: number[]; title: string }) {
    if (!data || data.length === 0) return null;

    return (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg border">
            <p className="text-xs font-semibold text-muted-foreground mb-2">{title}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
                {data.map((val, index) => (
                    <span key={index} className="font-mono text-xs bg-background px-1.5 py-0.5 rounded border">
                        {formatNumber(val)}
                    </span>
                ))}
            </div>
        </div>
    );
}

/**
 * Renders a matrix (a 2D array of numbers) in a structured table.
 */
export function MatrixDisplay({ data, headers, title }: { data: number[][]; headers: string[]; title: string }) {
    if (!data || data.length === 0 || data[0].length === 0) return null;

    return (
        <div className="mt-4 p-2 bg-muted/50 rounded-lg border">
            <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">{title}</p>
            <div className="overflow-x-auto">
                <Table className="bg-background rounded-md min-w-full">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12 sticky left-0 bg-background"></TableHead>
                            {headers.map(header => <TableHead key={header} className="text-center font-bold">{header}</TableHead>)}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                                <TableCell className="font-bold sticky left-0 bg-background">{headers[rowIndex]}</TableCell>
                                {row.map((cell, cellIndex) => (
                                    <TableCell key={cellIndex} className="text-center font-mono text-xs">
                                        {formatNumber(cell)}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
