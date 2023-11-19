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
From: [starting process unit/chemical]
To: [ending process unit/chemical]
Edge Description: [description of the process or material flow (try to keep it max 5 words)]
 
Please ensure the output is concise and accurately reflects the process flow described in the text. Consider all relevant chemical engineering principles and standard industry practices in your analysis.    
Make sure you do not use any special characters in your output. Only allowed characters are: a-z, A-Z, 0-9, comma, period,[],\n, and space.
Do not give any none values for the nodes, maintain the format From: [starting process unit/chemical] and To: [ending process unit/chemical] for all the nodes.
And for edges, if you are not able to find any edge description, please give the edge description as "".
Text Corpus Input:
${textCorpus}

Based on the information provided, construct the connections and describe the process flow accurately.
`;
}

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
    const lines = output.split('\n');
    console.log(lines);
    const nodes = {};
    const links = [];

    for (let i = 0; i < lines.length; i += 4) {
      const fromNode = lines[i]?.replace('From: ', '').trim();
      const toNode = lines[i + 1]?.replace('To: ', '').trim();
      const processDescription = lines[i + 2]?.replace('Edge Description: ', '').trim();
  
      // Create or update nodes
      if (!nodes[fromNode]) {
        nodes[fromNode] = { id: fromNode };
      }
      if (!nodes[toNode]) {
        nodes[toNode] = { id: toNode };
      }
  
      // Create a link between fromNode and toNode
      links.push({
        source: fromNode,
        target: toNode,
        description: processDescription,
      });
    }
  
    // Convert nodes object to an array
    const nodesArray = Object.values(nodes);
  
    return { nodes: nodesArray, links };
  }
  function convertToMermaidGraph(data) {
    const { nodes, links } = data;
  
    // Helper function to format labels with line breaks after every two words
    function formatLabel(label) {
      const words = label.split(' ');
      let formattedLabel = '';
      for (let i = 0; i < words.length; i++) {
        formattedLabel += words[i] + ' ';
        if ((i + 1) % 2 === 0 && i + 1 < words.length) formattedLabel += '\\n '; // Add line break
      }
      return formattedLabel;
    }
  
    // Convert nodes to Mermaid format
    const mermaidNodes = nodes.map(node => `${node.id.replace(/\s+/g, '_')}["${formatLabel(node.id)}"]`);
  
    // Convert links to Mermaid format with quotations
    const mermaidLinks = links.map(link => {
      const sourceId = link.source.replace(/\s+/g, '_');
      const targetId = link.target.replace(/\s+/g, '_');
      const formattedDescription = `"${formatLabel(link.description)}"`; // Enclose link descriptions in quotes
      return `${sourceId} -->|${formattedDescription}| ${targetId}`;
    });
  
    // Combine nodes and links into Mermaid graph syntax
    return `graph TB\n  ${mermaidNodes.join('\n  ')}\n  ${mermaidLinks.join('\n  ')}`;
  }
  