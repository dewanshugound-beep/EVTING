import React from "react";
import PlaygroundClient from "./PlaygroundClient";

export const metadata = {
  title: "Matrix Playground — Experimental CodePen",
  description: "Write HTML, CSS, and JS. Execute them instantly in a secure sandbox.",
};

export default function PlaygroundPage() {
  return <PlaygroundClient />;
}
