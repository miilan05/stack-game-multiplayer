const fs = require("fs");
const madge = require("madge");

const outputPath = "./src/output.svg";

madge("./src/script.js")
    .then(res => res.svg())
    .then(output => {
        fs.writeFileSync(outputPath, output.toString());
        console.log(`SVG file created at: ${outputPath}`);
    })
    .catch(error => {
        console.error("An error occurred:", error);
    });
