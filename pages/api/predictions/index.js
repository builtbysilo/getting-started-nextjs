import multer from "multer";
import Replicate from "replicate";
import fetch from "node-fetch";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error(
      "The REPLICATE_API_TOKEN environment variable is not set. See README.md for instructions on how to set it."
    );
  }

  const multerHandler = upload.fields([
    {name: "swap_image"},
    {name: "target_image"},
  ]);

  await new Promise((resolve, reject) => {
    multerHandler(req, res, (err) => {
      if (err) {
        console.error("Multer Error:", err);
        res.statusCode = 500;
        res.end(JSON.stringify({detail: err.message}));
        return reject(err);
      }
      resolve();
    });
  });

  const swapImage = req.files["swap_image"] && req.files["swap_image"][0];
  const targetImage = req.files["target_image"] && req.files["target_image"][0];

  const targetImageDataUrl = `data:${
    targetImage.mimetype
  };base64,${targetImage.buffer.toString("base64")}`;
  const swapImageDataUrl = `data:${
    swapImage.mimetype
  };base64,${swapImage.buffer.toString("base64")}`;

  if (!swapImage || !targetImage) {
    res.statusCode = 400;
    return res.end(
      JSON.stringify({
        detail: "Both swap image and target image must be uploaded.",
      })
    );
  }

  const model =
    "vbarter/faceswap:a2931eb76fdde4505638e596d0b452535e28c94b02a418c4f95accc9084b1eed";

  try {
    // First API call
    const input = {
      input: {
        swap_image: swapImageDataUrl,
        target_image: targetImageDataUrl,
      },
    };

    const output = await replicate.run(model, input);

    if (output?.error) {
      res.statusCode = 500;
      res.end(JSON.stringify({detail: output.error}));
      return;
    }

    // Assuming the URL of the image from the response is stored in output.image_url
    const response = await fetch(output);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from ${output}`);
    }
    const imageBuffer = await response.buffer();
    const imageUrlData = `data:image/jpeg;base64,${imageBuffer.toString(
      "base64"
    )}`;

    const model2 =
      "sczhou/codeformer:7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56";

    // Second API call
    const secondInput = {
      input: {
        image: imageUrlData,
      },
    };

    const secondOutput = await replicate.run(model2, secondInput);

    if (secondOutput?.error) {
      res.statusCode = 500;
      res.end(JSON.stringify({detail: secondOutput.error}));
      return;
    }

    res.statusCode = 201;
    res.end(JSON.stringify(secondOutput));
  } catch (err) {
    console.error("Error:", err);
    res.statusCode = 500;
    res.end(JSON.stringify({detail: err.message}));
  }
}
