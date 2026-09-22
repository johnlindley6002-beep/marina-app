"use client";

import dynamic from "next/dynamic";

const MarinaMap = dynamic(() => import("./MarinaMap"), { ssr: false });

export default MarinaMap;
