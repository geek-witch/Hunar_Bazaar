"use client";

import React from "react";
import { motion } from "framer-motion";
import { Page, Navigation } from "../App";
import { StarIcon, CircleIcon, BookOpenIcon, UsersIcon, ZapIcon, CheckCircleIcon, GlobeIcon, ExchangeIcon, PlusCircleIcon } from "../components/icons/MiscIcons";
import { CreditIcon, BadgeIcon } from "../components/icons/AccountIcons";
// Using an inline SVG for a crisper hero illustration
import heroGif from "../asset/aboutus.gif";
import jaweriaImg from "../asset/jaweria.png";
import ayeshaImg from "../asset/ayesha.png";
import emaanImg from "../asset/emaan.png";

const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
};

const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

const stagger = {
    visible: {
        transition: {
            staggerChildren: 0.2,
        },
    },
};

/* HeroIllustration removed — using GIF background and clean text layout */

const AboutUsPage: React.FC<{ navigation: Navigation }> = ({ navigation }) => {
    return (
        <motion.div
            className="bg-brand-light-blue overflow-hidden text-gray-800"
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.6 }}
        >
           {/* ================= HERO SECTION ================= */}
<section className="relative text-white bg-gradient-to-r from-brand-teal via-brand-teal-dark to-brand-teal">
    {/* GIF background layer */}
    <div
        className="absolute inset-0 bg-cover bg-center opacity-20 pointer-events-none"
        style={{ backgroundImage: `url(${heroGif})` }}
    />

    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-[70vh] md:h-[80vh] flex items-center justify-center relative z-10">
        
        {/* Text WITHOUT animation */}
        <div className="text-center max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                About Hunar Bazaar
            </h1>

            <p className="mt-6 text-lg text-gray-200 mx-auto max-w-2xl">
                Revolutionizing skill exchange through peer-to-peer learning, where
                knowledge is currency and growth is mutual.
            </p>
        </div>
    </div>
</section>



            {/* ================= MISSION & VISION ================= */}
            <section className="py-16 sm:py-20 bg-white relative overflow-hidden">
                <motion.div
                    className="absolute top-12 right-1/4 opacity-40"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                >
                    <StarIcon className="w-6 h-6 text-brand-accent-yellow" />
                </motion.div>

                <motion.div
                    className="absolute bottom-16 left-1/4 opacity-40"
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                >
                    <CircleIcon className="w-8 h-8 text-brand-accent-peach" />
                </motion.div>

                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        className="grid md:grid-cols-2 gap-12"
                        variants={stagger}
                    >
                        {/* Mission box */}
                        <motion.div
                            variants={fadeUp}
                            whileHover={{ y: -6 }}
                            className="bg-brand-light-blue p-8 rounded-lg shadow-md"
                        >
                            <h2 className="text-3xl font-bold text-brand-teal mb-4">Our Mission</h2>
                            <p className="text-gray-700 leading-relaxed">
                                To democratize learning by creating a platform where everyone can teach what they know and learn what they need—without financial barriers.
                            </p>
                        </motion.div>

                        {/* Vision box */}
                        <motion.div
                            variants={fadeUp}
                            whileHover={{ y: -6 }}
                            className="bg-brand-light-blue p-8 rounded-lg shadow-md"
                        >
                            <h2 className="text-3xl font-bold text-brand-teal mb-4">Our Vision</h2>
                            <p className="text-gray-700 leading-relaxed">
                                To build the world's largest skill-exchange ecosystem where every individual becomes both a teacher and a student.
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ================= WHAT WE OFFER ================= */}
            <section className="py-16 sm:py-20 bg-brand-light-blue relative overflow-hidden">
                <motion.div
                    className="absolute top-20 left-10 opacity-30"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 4, repeat: Infinity }}
                >
                    <CircleIcon className="w-10 h-10 text-brand-accent-sky" />
                </motion.div>

                <motion.div
                    className="absolute bottom-20 right-10 opacity-50"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                >
                    <StarIcon className="w-6 h-6 text-brand-accent-coral" />
                </motion.div>

                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        className="text-center mb-12"
                        variants={fadeUp}
                    >
                        <h2 className="text-3xl font-bold text-brand-teal">What Makes Us Different</h2>
                        <motion.div
                            className="w-24 h-1 bg-brand-teal mx-auto mt-2"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.6 }}
                        ></motion.div>
                    </motion.div>

                    <motion.div
                        className="grid md:grid-cols-3 gap-8"
                        variants={stagger}
                    >
                        {[
                            { Icon: CreditIcon, title: "Credit-Based System" },
                            { Icon: BookOpenIcon, title: "Interactive Learning" },
                            { Icon: ZapIcon, title: "AI-Powered Matching" },
                            { Icon: BadgeIcon, title: "Certificates" },
                            { Icon: GlobeIcon, title: "Global Community" },
                            { Icon: CheckCircleIcon, title: "Safe & Secure" },
                        ].map((item, index) => (
                            <motion.div
                                key={index}
                                variants={fadeUp}
                                whileHover={{ scale: 1.05 }}
                                className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl"
                            >
                                <div className="bg-brand-teal text-white w-12 h-12 rounded-full flex items-center justify-center mb-4 text-xl font-bold">
                                    <item.Icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-semibold text-brand-teal mb-3">{item.title}</h3>
                                <p className="text-gray-600">
                                    Engaging description goes here for this feature.
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ================= TEAM ================= */}
            <section className="py-16 sm:py-20 bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        className="text-center mb-12"
                        variants={fadeUp}
                    >
                        <h2 className="text-3xl font-bold text-brand-teal">Meet Our Team</h2>
                        <motion.div
                            className="w-24 h-1 bg-brand-teal mx-auto mt-2 mb-4"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.6 }}
                        ></motion.div>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            A dedicated group of FAST-NUCES students working to revolutionize learning.
                        </p>
                    </motion.div>

                    <motion.div
                        className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto"
                        variants={stagger}
                    >
                        {[
                            { img: jaweriaImg, name: "Jaweria Rehman", roll: "22F-3352" },
                            { img: ayeshaImg, name: "Ayesha Nazir", roll: "22F-3254" },
                            { img: emaanImg, name: "Emaan Fatima", roll: "22F-3640" },
                        ].map((member, index) => (
                            <motion.div
                                key={index}
                                variants={fadeUp}
                                whileHover={{ y: -8 }}
                                className="text-center bg-brand-light-blue p-6 rounded-lg"
                            >
                                <img src={member.img} alt={member.name} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" />
                                <h3 className="text-xl font-semibold text-brand-teal">{member.name}</h3>
                                <p className="text-gray-600 text-sm mt-1">{member.roll}</p>
                                <p className="text-gray-500 text-sm mt-2">Developer</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ================= VALUES ================= */}
            <section className="py-16 sm:py-20 bg-brand-teal text-white relative">
                {/* GIF background for Core Values */}
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none"
                    style={{ backgroundImage: `url(${heroGif})` }}
                />

                <motion.div
                    className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
                    variants={stagger}
                >
                    <motion.div
                        className="text-center mb-12"
                        variants={fadeUp}
                    >
                        <h2 className="text-3xl font-bold">Our Core Values</h2>
                        <div className="w-24 h-1 bg-white mx-auto mt-2"></div>
                    </motion.div>

                    <motion.div
                        className="grid md:grid-cols-4 gap-8 text-center"
                        variants={stagger}
                    >
                        {[
                            { Icon: ExchangeIcon, title: "Collaboration" },
                            { Icon: ZapIcon, title: "Innovation" },
                            { Icon: StarIcon, title: "Excellence" },
                            { Icon: PlusCircleIcon, title: "Inclusivity" },
                        ].map((v, i) => (
                            <motion.div
                                key={i}
                                variants={fadeUp}
                                whileHover={{ scale: 1.1 }}
                            >
                                <div className="mx-auto text-4xl mb-4 text-white"><v.Icon className="w-10 h-10 mx-auto" /></div>
                                <h3 className="text-xl font-semibold mb-2">{v.title}</h3>
                                <p className="text-gray-200 text-sm">Description here</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>
            </section>

            {/* ================= CTA ================= */}
            <section className="py-16 sm:py-20 bg-brand-light-blue text-center">
                <motion.div
                    className="container mx-auto px-4 sm:px-6 lg:px-8"
                    variants={fadeUp}
                >
                    <h2 className="text-3xl font-bold text-brand-teal mb-4">
                        Ready to Start Your Journey?
                    </h2>

                    <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                        Join thousands of learners and teachers exchanging skills every day.
                    </p>

                    <motion.button
                        onClick={() => navigation.navigateTo(Page.Signup1)}
                        className="bg-brand-teal hover:bg-brand-teal-dark text-white font-semibold px-8 py-3 rounded-lg shadow-lg"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Join Hunar Bazaar Today
                    </motion.button>
                </motion.div>
            </section>
        </motion.div>
    );
};

export default AboutUsPage;
