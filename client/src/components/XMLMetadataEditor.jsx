import React, { useState, useEffect } from "react";
import {
  Upload,
  Download,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Eye,
  Code,
  Cloud,
  RefreshCw,
} from "lucide-react";
const API_URL = import.meta.env.VITE_API_URL;

const XMLMetadataEditor = () => {
  const [xmlData, setXmlData] = useState([]);
  const [originalXmlData, setOriginalXmlData] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const [fileName, setFileName] = useState("metadata.xml");
  const [savedFiles, setSavedFiles] = useState([]);
  const [loading, setLoading] = useState(false);


  // Load sample data on mount
  useEffect(() => {
    const sampleData = [
      {
        id: 1,
        tag: "title",
        value: "Sample Document",
        attributes: 'lang="en"',
      },
      { id: 2, tag: "author", value: "John Doe", attributes: "" },
      {
        id: 3,
        tag: "date",
        value: "2024-01-20",
        attributes: 'format="YYYY-MM-DD"',
      },
      { id: 4, tag: "version", value: "1.0", attributes: "" },
      {
        id: 5,
        tag: "description",
        value: "A sample metadata document",
        attributes: "",
      },
    ];
    setXmlData(sampleData);
    setOriginalXmlData(JSON.parse(JSON.stringify(sampleData)));
    fetchSavedFiles();
  }, []);

  // Fetch saved files from backend
  // Update the fetchSavedFiles function:
  const fetchSavedFiles = async () => {
    try {
      console.log("Fetching saved files...");
      const response = await fetch(`${API_URL}/api/xml/files`);
      const data = await response.json();
      console.log("Files response:", data);

      if (data.success) {
        setSavedFiles(data.files || []);
      }
    } catch (error) {
      console.error("Error fetching saved files:", error);
    }
  };

  const handleCellEdit = (id, field, value) => {
    setXmlData((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const handleAddRow = () => {
    const newId = Math.max(...xmlData.map((r) => r.id), 0) + 1;
    setXmlData((prev) => [
      ...prev,
      {
        id: newId,
        tag: "newtag",
        value: "",
        attributes: "",
      },
    ]);
  };

  const handleDeleteRow = (id) => {
    setXmlData((prev) => prev.filter((row) => row.id !== id));
  };

  const handleReset = () => {
    setXmlData(JSON.parse(JSON.stringify(originalXmlData)));
  };

  const handleSave = () => {
    setOriginalXmlData(JSON.parse(JSON.stringify(xmlData)));
    alert("Changes saved successfully!");
  };

  const generateXML = (data) => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<metadata>\n';
    data.forEach((row) => {
      const attrs = row.attributes ? " " + row.attributes : "";
      xml += `  <${row.tag}${attrs}>${row.value}</${row.tag}>\n`;
    });
    xml += "</metadata>";
    return xml;
  };

  const handleExport = () => {
    const xml = generateXML(xmlData);
    const blob = new Blob([xml], { type: "text/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(event.target.result, "text/xml");
        const elements = xmlDoc.documentElement.children;

        const parsedData = Array.from(elements).map((el, idx) => {
          const attrs = Array.from(el.attributes)
            .map((attr) => `${attr.name}="${attr.value}"`)
            .join(" ");

          return {
            id: idx + 1,
            tag: el.tagName,
            value: el.textContent,
            attributes: attrs,
          };
        });

        setXmlData(parsedData);
        setOriginalXmlData(JSON.parse(JSON.stringify(parsedData)));
      } catch (error) {
        alert("Error parsing XML file");
        console.error("XML Parse Error:", error);
      }
    };
    reader.readAsText(file);
  };

  // Save to backend
  const handleSaveToCloud = async () => {
    setLoading(true);
    try {
      const xml = generateXML(xmlData);
      console.log("Saving to server:", {
        filename: fileName,
        contentLength: xml.length,
      });

      const response = await fetch(`${API_URL}/api/xml/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: fileName,
          content: xml,
        }),
      });

      const data = await response.json();
      console.log("Server response:", data);

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to save file");
      }

      if (data.success) {
        alert("File saved to server successfully!");
        fetchSavedFiles();
      } else {
        throw new Error(data.error || "Failed to save file");
      }
    } catch (error) {
      console.error("Error saving to server:", error);
      alert("Error saving to server: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  //    Update the handleLoadFromCloud function:
  const handleLoadFromCloud = async (filename) => {
    setLoading(true);
    try {
      console.log("Loading file:", filename);
      const response = await fetch(`${API_URL}/api/xml/load/${filename}`);
      const data = await response.json();
      console.log("Load response:", data);

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to load file");
      }

      if (data.success) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data.content, "text/xml");
        const elements = xmlDoc.documentElement.children;

        const parsedData = Array.from(elements).map((el, idx) => {
          const attrs = Array.from(el.attributes)
            .map((attr) => `${attr.name}="${attr.value}"`)
            .join(" ");

          return {
            id: idx + 1,
            tag: el.tagName,
            value: el.textContent,
            attributes: attrs,
          };
        });

        setXmlData(parsedData);
        setOriginalXmlData(JSON.parse(JSON.stringify(parsedData)));
        setFileName(filename);
        alert("File loaded successfully!");
      } else {
        throw new Error(data.error || "Failed to load file");
      }
    } catch (error) {
      console.error("Error loading file:", error);
      alert("Error loading file: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Update the handleDeleteFromCloud function:
  const handleDeleteFromCloud = async (filename) => {
    if (!confirm(`Delete ${filename}?`)) return;

    setLoading(true);
    try {
      console.log("Deleting file:", filename);
      const response = await fetch(`${API_URL}/api/xml/delete/${filename}`, {
        method: "DELETE",
      });
      const data = await response.json();
      console.log("Delete response:", data);

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to delete file");
      }

      if (data.success) {
        alert("File deleted successfully!");
        fetchSavedFiles();
      } else {
        throw new Error(data.error || "Failed to delete file");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Error deleting file: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const hasChanges =
    JSON.stringify(xmlData) !== JSON.stringify(originalXmlData);

  const EditableCell = ({ value, onSave, placeholder }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);

    useEffect(() => {
      setTempValue(value);
    }, [value]);

    const handleBlur = () => {
      setIsEditing(false);
      onSave(tempValue);
    };

    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        handleBlur();
      } else if (e.key === "Escape") {
        setTempValue(value);
        setIsEditing(false);
      }
    };

    return (
      <div
        className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded min-h-8"
        onClick={() => setIsEditing(true)}
      >
        {isEditing ? (
          <input
            type="text"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
            autoFocus
            placeholder={placeholder}
          />
        ) : (
          <span className={value ? "" : "text-gray-400"}>
            {value || placeholder}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                XML Metadata Editor
              </h1>
              <p className="text-gray-600 mt-1">
                Edit, manage, and export XML metadata
              </p>
            </div>
            <Code className="w-10 h-10 text-blue-600" />
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap gap-3 mb-6">
            <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition">
              <Upload className="w-4 h-4" />
              Import XML
              <input
                type="file"
                accept=".xml"
                onChange={handleImport}
                className="hidden"
              />
            </label>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Download className="w-4 h-4" />
              Export XML
            </button>

            <button
              onClick={handleSaveToCloud}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition disabled:opacity-50"
            >
              <Cloud className="w-4 h-4" />
              Save to Server
            </button>

            <button
              onClick={fetchSavedFiles}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Files
            </button>

            <button
              onClick={handleAddRow}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <Plus className="w-4 h-4" />
              Add Row
            </button>

            {hasChanges && (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>

                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              </>
            )}

            <button
              onClick={() => setShowComparison(!showComparison)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                showComparison
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <Eye className="w-4 h-4" />
              {showComparison ? "Hide" : "Show"} Comparison
            </button>
          </div>

          {/* Saved Files List */}
          {savedFiles.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2 text-gray-700">
                Saved Files on Server:
              </h3>
              <div className="flex flex-wrap gap-2">
                {savedFiles.map((file) => (
                  <div
                    key={file}
                    className="flex items-center gap-2 bg-white px-3 py-1 rounded border"
                  >
                    <button
                      onClick={() => handleLoadFromCloud(file)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {file}
                    </button>
                    <button
                      onClick={() => handleDeleteFromCloud(file)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasChanges && (
            <div className="mb-4 px-4 py-2 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded">
              You have unsaved changes
            </div>
          )}

          {/* Main Content Area */}
          <div className={showComparison ? "grid grid-cols-2 gap-6" : ""}>
            {/* Current Data Table */}
            <div>
              {showComparison && (
                <h3 className="text-lg font-semibold mb-3 text-gray-700">
                  Current Version
                </h3>
              )}
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Tag Name
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Value
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Attributes
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {xmlData.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <EditableCell
                            value={row.tag}
                            onSave={(val) => handleCellEdit(row.id, "tag", val)}
                            placeholder="tag-name"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <EditableCell
                            value={row.value}
                            onSave={(val) =>
                              handleCellEdit(row.id, "value", val)
                            }
                            placeholder="value"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <EditableCell
                            value={row.attributes}
                            onSave={(val) =>
                              handleCellEdit(row.id, "attributes", val)
                            }
                            placeholder='attr="value"'
                          />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => handleDeleteRow(row.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                            title="Delete row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Original Data Comparison */}
            {showComparison && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-700">
                  Original Version
                </h3>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Tag Name
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Value
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Attributes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {originalXmlData.map((row) => (
                        <tr key={row.id} className="bg-gray-50">
                          <td className="px-4 py-3 text-gray-600">{row.tag}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {row.value}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {row.attributes}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* XML Preview */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">
              XML Preview
            </h3>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
              {generateXML(xmlData)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XMLMetadataEditor;
