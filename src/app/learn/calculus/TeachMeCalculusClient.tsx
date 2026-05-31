"use client";

import { CalculusProgressProvider } from "@/components/calculus/progress";
import {
  DesktopToc,
  MobileToc,
  ScrollProgressBar,
} from "@/components/calculus/TableOfContents";

import Hero from "./sections/Hero";
import IntroSection from "./sections/IntroSection";
import PrereqsSection from "./sections/PrereqsSection";
import LimitsSection from "./sections/LimitsSection";
import DerivativesSection from "./sections/DerivativesSection";
import DerivRulesSection from "./sections/DerivRulesSection";
import DerivAppsSection from "./sections/DerivAppsSection";
import IntegralsSection from "./sections/IntegralsSection";
import IntTechniquesSection from "./sections/IntTechniquesSection";
import IntAppsSection from "./sections/IntAppsSection";
import SeriesSection from "./sections/SeriesSection";
import ParametricPolarSection from "./sections/ParametricPolarSection";
import DiffEqSection from "./sections/DiffEqSection";
import MultivariableSection from "./sections/MultivariableSection";
import RealWorldSection from "./sections/RealWorldSection";
import CheatSheetSection from "./sections/CheatSheetSection";
import PracticeSection from "./sections/PracticeSection";
import FaqSection from "./sections/FaqSection";
import GlossarySection from "./sections/GlossarySection";

export default function TeachMeCalculusClient() {
  return (
    <CalculusProgressProvider>
      <ScrollProgressBar />
      <div className="mx-auto max-w-[1200px] px-4 pb-24 pt-2 sm:px-6">
        <Hero />
        <div className="flex gap-8">
          <DesktopToc />
          <div className="min-w-0 flex-1 divide-y divide-border-light">
            <IntroSection />
            <PrereqsSection />
            <LimitsSection />
            <DerivativesSection />
            <DerivRulesSection />
            <DerivAppsSection />
            <IntegralsSection />
            <IntTechniquesSection />
            <IntAppsSection />
            <SeriesSection />
            <ParametricPolarSection />
            <DiffEqSection />
            <MultivariableSection />
            <RealWorldSection />
            <CheatSheetSection />
            <PracticeSection />
            <FaqSection />
            <GlossarySection />
          </div>
        </div>
      </div>
      <MobileToc />
    </CalculusProgressProvider>
  );
}
