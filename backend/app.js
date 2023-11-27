require('dotenv').config();
const OpenAIApi = require("openai");
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAIApi({ apiKey: OPENAI_API_KEY });


const app = express();
app.use(express.json());


app.use(cors());

app.use(bodyParser.json());



app.post('/getOpenAIResponse', async (req, res) => {
  try {
    const relationships = await extractRelationships(req.body.text);
    // const relationships2 = await extractRelationships(req.body.text);
    // console.log(relationships);
    // console.log(relationships);
    res.json(relationships);

  } catch (error) {
    console.error("Error:", error);
    res.status(500).send('Error occurred while processing your request.');
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

});


function buildPrompt(textCorpus) {
  return `
As a knowledgeable assistant in chemical engineering, your task is to analyze the following text and extract key information to construct a process flow diagram. Focus on identifying the various process units (nodes) and the flow of materials or operations between them (edges). For each transition, provide a clear description of the process occurring. Your output should list each connection in the format: 


Follow this format strictly, I dont want any other format. DO NOT Include '(' or ')' in this format
From: 
To: 
Edge Description: 

In this "From" is starting process unit/chemical and "To" is ending process unit/chemical. And "Edge Description" is the description of the process between the two nodes(try to keep it at max 30 characters).
 
Ensure that it should cover the steps from the initial selection of the
process to be used, through to the issuing of the process flowsheets and includes
the selection, specification, and chemical engineering design of equipment and the output is concise and accurately reflects the process flow described in the text. 

Consider all relevant chemical engineering technology principles and standard industry practices in your analysis.    

Maintain the format From: starting process unit/chemical and To: ending process unit/chemical for all the nodes.

And for edges, if you are not able to find any edge description, please give the edge description as "".
Text Corpus Input:

${textCorpus}

DO NOT! give anything else like summary or conclusion, only give the graph in the format as required above.
Based on the information provided, construct the connections and describe the process flow accurately.


Again reminding, Do NOT GIVE Anything else other than the graph in the format as required above.

`;
}
// function buildPrompt(textCorpus) {
//   const promptData = {
//       "instructions": {
//           "context": "Chemical Engineering Process Analysis",
//           "task_description": "Analyze the text to construct a process flow diagram in a JSON format.",
//           "objectives": [
//               "Identify process units (nodes).",
//               "Identify flow of materials or operations (edges).",
//               "Provide a clear and concise description for each process transition."
//           ],
//           "output_requirements": {
//               "format": "Output each connection as a JSON object within an array.",
//               "example": `[
//                       "from": "Example Start Process",
//                       "to": "Example End Process",
//                       "edge_description": "Example Process Description",  
//               ]`,
//               "notes": "Use an empty string for 'edge_description' if not applicable."
//           },
//           "process_coverage": [
//               "Include steps from initial process selection to process flowsheet issuance.",
//               "Incorporate equipment selection, specification, and design."
//           ],
//           "quality_guidelines": {
//               "conciseness": "Output should be concise and accurate.",
//               "relevance": "Reflect the process flow described in the text.",
//               "standard_practices": "Adhere to chemical engineering principles and industry practices."
//           },
//           "restrictions": {
//               "content_limitations": ["Do not include summary or conclusion."],
//               "format_adherence": "Strictly follow the provided JSON format for output."
//           }
//       },
//       "text_corpus": textCorpus
//   };

//   return JSON.stringify(promptData, null, 4);
// }


async function extractRelationships(input) {
  try {
    const prompt = buildPrompt(input);
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "Extract 'source-target-process' relationships from the given text.",
        },
        { role: "user", content: prompt },
      ],
    });

    if (
      chatCompletion &&
      chatCompletion.choices &&
      chatCompletion.choices.length > 0
    ) {
      const responseText = chatCompletion.choices[0].message.content;
      let relationships= outputProcessor(responseText);
        return convertToMermaidGraph(relationships);

    //   return relationships;
    } else {
      console.log("No data found in response");
      return null;
    }
  } catch (error) {
    console.error("Error in extracting relationships:", error);
    return null;
  }
}
// Example text input

// Example text input
// const textInput = `
//   The hydrocarbon industry first introduces crude oil to a pre-treatment unit where impurities are removed. 
//   This stream is then passed to a Carbon Capture Unit, where a Monoethanolamine (MEA) based solvent captures 
//   up to 90% of the CO2 emissions. The CO2-rich solvent undergoes a stripping process, releasing pure CO2 which 
//   is then compressed and stored underground. The treated hydrocarbon stream, now significantly reduced in CO2 
//   content, proceeds to the standard refining units.
//   `;

async function run() {
  try {
    const relationships = await extractRelationships(textInput);
    console.log("Extracted Relationships:\n", relationships);
  } catch (error) {
    console.error("Error:", error);
  }
}

// run()

function outputProcessor(output) {
    const lines = output?.split('\n');
    console.log(lines);
    const nodes = {};
    const links = [];

    for (let i = 0; i < lines.length; i += 4) {
      let fromNode = lines[i]?.replace('From: ', '').trim();
      let toNode = lines[i + 1]?.replace('To: ', '').trim();
      // clean up the node names based on Mermiad syntax replace all special characters with _
      // fromNode = fromNode.replace(/[^a-zA-Z0-9 ]/g, '_');
      // toNode = toNode.replace(/[^a-zA-Z0-9 ]/g, '_');
      if (fromNode === '' || toNode === '') fromNode = toNode = 'output/input';
      const processDescription = lines[i + 2]?.replace('Edge Description: ', '').trim();
  
      // Create or update nodes
      if (!nodes[fromNode]) {
        nodes[fromNode] = { id: (fromNode) };
      }
      if (!nodes[toNode]) {
        nodes[toNode] = { id: (toNode) };
      }
  
      // Create a link between fromNode and toNode
      links.push({
        source: hasher(fromNode),
        target: hasher(toNode),
        description: processDescription,
      });
    }
  
    // Convert nodes object to an array
    const nodesArray = Object.values(nodes);
  
    return { nodes: nodesArray, links };
  }
  function hasher(str) {
    let hash = 0;
    // this should be an exact 12 digit string to avoid collisions, implement a better hashing function if needed
    
    const hashLength = 12;
    for (let i = 0; i < str?.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) & 0xffffffff;
    }
    let hashString = hash.toString();
    if (hashString.length < hashLength) {
      hashString = hashString.padStart(hashLength, '0');
    }
    return hashString;
  }
  function convertToMermaidGraph(data) {
    const { nodes, links } = data;
  
    // Helper function to format labels with line breaks after every two words
    function formatLabel(label) {
      const words = label?.split(' ');
      let formattedLabel = '';
      for (let i = 0; i < words?.length; i++) {
        formattedLabel += words[i] + ' ';
        if ((i + 1) % 2 === 0 && i + 1 < words?.length) formattedLabel += '\\n '; // Add line break
      }
      return formattedLabel;
    }
  
    // Convert nodes to Mermaid format
    const mermaidNodes = nodes.map(node => `${hasher(node.id)}["${formatLabel(node.id)?.replace(`(`,'')?.replace(`)`,'')}"]`);
  
    // Convert links to Mermaid format with quotations
    const mermaidLinks = links.map(link => {
      const sourceId = link.source;
      const targetId = link.target;
      const formattedDescription = `${formatLabel(link.description?.replace(`"`,''))}`?.replace(`"`,''); // Enclose link descriptions in quotes
      if(formattedDescription?.length<=2)return `${sourceId} --> ${targetId}`;
      return `${sourceId} -->|"${formattedDescription}"| ${targetId}`;
    });
    console.log(`graph TB\n  ${mermaidNodes.join('\n  ')}\n  ${mermaidLinks.join('\n  ')}`)
    // Combine nodes and links into Mermaid graph syntax
    return `graph TB\n  ${mermaidNodes.join('\n  ')}\n  ${mermaidLinks.join('\n  ')}`;
  }
  