document.addEventListener("DOMContentLoaded", async () => {
  // Dynamically import Mermaid
  const mermaid = await import(
    "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs"
  );

  // Initialize Mermaid
  mermaid.default.initialize({ startOnLoad: false });

  document
    .getElementById("generateGraph")
    .addEventListener("click", async function () {
      const processText = document.getElementById("processText").value;
      // Check if the text length is within the required range
    //   if (processText.length < 40 || processText.length > 2000) {
    //     alert(
    //       "Text must be at least 40 characters and no more than 2000 characters long."
    //     );
    //     return; // Exit the function if the condition is not met
    //   }

      const loader = document.getElementById("loader");
      loader.style.display = "block"; // Show the loader

      try {
        const mermaidContainer = document.querySelector(".mermaid");
        mermaidContainer.innerHTML = "";
        const response = await fetch(
          "http://localhost:3000/getOpenAIResponse",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: processText }),
          }
        );

        const result = await response.json();
        const graphDefinition = result; // Adjust according to your response structure

        const graphElement = document.createElement("div");
        graphElement.className = "mermaid";
        graphElement.textContent = graphDefinition;
        mermaidContainer.appendChild(graphElement);

        mermaid.default.init(undefined, graphElement);
      } catch (error) {
        console.error("Error during fetch:", error);
      } finally {
        loader.style.display = "none"; // Hide the loader
      }
    });
  document
    .getElementById("downloadGraph")
    .addEventListener("click", function () {
      const svgElement = document.querySelector(".mermaid svg");
      if (!svgElement) {
        alert("Please generate a graph first.");
        return;
      }

      const svgData = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgData], { type: "image/svg+xml" });

      // Use FileSaver.js to save the file
      let randomString = Math.random().toString(36).substring(7);
      saveAs(blob, randomString + ".svg");
    });
});
