import {useState} from "react";
import Head from "next/head";
import Image from "next/image";

export default function Home() {
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  //? Target Image Path
  const TARGET_IMAGE_PATH = "/astro.jpg";

  //? Image Preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  //? Generate Image
  const handleSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();

    const file = e.target.img.files[0];
    if (!file) {
      setError("No file selected");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("swap_image", file);

    const targetImageResponse = await fetch(TARGET_IMAGE_PATH);
    const targetImageBlob = await targetImageResponse.blob();
    formData.append("target_image", targetImageBlob, TARGET_IMAGE_PATH);

    const response = await fetch("/api/predictions", {
      method: "POST",
      body: formData,
    });

    let responseData = await response.json();

    if (response.status !== 201) {
      setError(responseData.detail);
      setLoading(false);
      return;
    }

    setPrediction(responseData);
    setLoading(false);
  };

  //? Download Image
  const handleDownload = async () => {
    const imageSrc = prediction; // Adjust this path

    // Fetch the image as a Blob
    const response = await fetch(imageSrc);
    if (!response.ok) {
      throw new Error("Failed to fetch image for download.");
    }
    const blob = await response.blob();

    // Create an Object URL from the Blob
    const url = URL.createObjectURL(blob);

    // Use a temporary anchor tag to trigger the download
    const a = document.createElement("a");
    a.href = url;
    a.download = "desired-filename.jpg"; // Adjust the desired filename
    a.click();

    // Cleanup (optional but recommended)
    URL.revokeObjectURL(url);
  };

  console.log(prediction);

  return (
    <div className="container max-w-2xl mx-auto p-5">
      <Head>
        <title>Replicate + Next.js</title>
      </Head>

      <h1 className="py-6 text-center font-bold text-2xl">
        Cody s DIY AI Face Swap
      </h1>

      <form className="w-full flex flex-col" onSubmit={handleSubmit}>
        <div class="flex items-center justify-center w-full">
          <label
            for="dropzone-file"
            class="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
          >
            <div class="flex flex-col items-center justify-center pt-5 pb-6">
              <svg
                class="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 16"
              >
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                />
              </svg>
              <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
                <span class="font-semibold">Click to upload</span> or drag and
                drop
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                SVG, PNG, JPG or GIF (MAX. 800x400px)
              </p>
            </div>
            <input
              id="dropzone-file"
              type="file"
              class="hidden"
              name="img"
              onChange={handleImageChange}
            />
          </label>
        </div>

        <button className="button" type="submit" disabled={loading}>
          {loading ? "Processing..." : "Go!"}
        </button>
      </form>

      {/* Display image preview */}
      {imagePreview && (
        <div className="mt-4">
          <Image
            src={imagePreview}
            alt="Image Preview"
            width={200}
            height={200}
          />
        </div>
      )}

      {/* Display spinner when loading */}
      {loading && (
        <div className="my-5 text-center">
          <div className="spinner" />
        </div>
      )}

      {error && <div>{error}</div>}

      {prediction && (
        <>
          {prediction && (
            <div className="image-wrapper mt-5">
              <Image src={prediction} alt="output" width={500} height={500} />
            </div>
          )}
          {prediction && (
            <button
              onClick={handleDownload}
              className="mt-3 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200"
            >
              Download Image
            </button>
          )}

          <p className="py-3 text-sm opacity-50">
            status: {prediction.status} ||{" "}
          </p>
        </>
      )}
    </div>
  );
}
