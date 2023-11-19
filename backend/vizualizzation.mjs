function convertToMermaidGraph(data) {
    const { nodes, links } = data;
  
    // Helper function to format labels with line breaks after every two words
    function formatLabel(label) {
      const words = label.split(' ');
      let formattedLabel = '';
      for (let i = 0; i < words.length; i++) {
        formattedLabel += words[i]+ ' ';
        if ((i + 1) % 2 === 0 && i + 1 < words.length) formattedLabel += '\\n '; // Add line break
      }
      return formattedLabel;
    }
  
    // Convert nodes to Mermaid format
    const mermaidNodes = nodes.map(node => `${node.id.replace(/\s+/g, '_')}["${formatLabel(node.id)}"]`);
  
    // Convert links to Mermaid format
    const mermaidLinks = links.map(link => {
      const sourceId = link.source.replace(/\s+/g, '_');
      const targetId = link.target.replace(/\s+/g, '_');
      return `${sourceId} -->|${link.description}| ${targetId}`;
    });
  
    // Combine nodes and links into Mermaid graph syntax
    return `graph LR\n  ${mermaidNodes.join('\n  ')}\n  ${mermaidLinks.join('\n  ')}`;
  }
  
  
  // Example usage
  const extractedRelationships = {
    nodes: [
        { id: 'Crude oil pre-treatment unit' },
        { id: 'Carbon Capture Unit' },
        { id: 'Stripping process unit' },
        { id: 'CO2 compression unit' },
        { id: 'Underground storage unit' },
        { id: 'Standard refining units' }
      ],
    
   
        links: [
          {
            source: 'Crude oil pre-treatment unit',
            target: 'Carbon Capture Unit',
            description: 'Impurity removal'
          },
          {
            source: 'Carbon Capture Unit',
            target: 'Stripping process unit',
            description: 'Monoethanolamine solvent capture'
          },
          {
            source: 'Stripping process unit',
            target: 'CO2 compression unit',
            description: 'Release of pure CO2'
          },
          {
            source: 'CO2 compression unit',
            target: 'Underground storage unit',
            description: 'CO2 compression and storage'
          },
          {
            source: 'Carbon Capture Unit',
            target: 'Standard refining units',
            description: 'Treated hydrocarbon stream'
          }
        ]
      
  };
  
  console.log(convertToMermaidGraph(extractedRelationships));
  