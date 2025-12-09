<template>
    <main>
        <DashboardTopNavigation :title="t('sidebarMenu.discover')"/>
        <div class="main-constrainer main-max-width">
            <div class="discover-archive-container">
                <div class="discover-archive-content">
                    <h1 class="archive-title">{{ t('discoverArchive.title') }}</h1>
                    
                    <div class="archive-intro">
                        <p class="intro-text">
                            {{ t('discoverArchive.intro') }}
                        </p>
                    </div>

                    <div class="technical-section">
                        <h2 class="section-title">{{ t('discoverArchive.technicalAchievement.title') }}</h2>
                        <p class="section-text">
                            {{ t('discoverArchive.technicalAchievement.paragraph1') }}
                        </p>
                        <p class="section-text highlight-box">
                            {{ t('discoverArchive.technicalAchievement.paragraph2a') }}
                            <strong>{{ t('discoverArchive.technicalAchievement.whisper') }}</strong>{{ t('discoverArchive.technicalAchievement.paragraph2b') }}
                            <strong>{{ t('discoverArchive.technicalAchievement.accuracy') }}</strong>{{ t('discoverArchive.technicalAchievement.paragraph2c') }}
                        </p>
                    </div>

                    <div class="feature-section">
                        <h2 class="section-title">{{ t('discoverArchive.userFeatures.title') }}</h2>
                        <p class="section-text">
                            {{ t('discoverArchive.userFeatures.intro') }}
                        </p>
                        <ul class="feature-list">
                            <li>{{ t('discoverArchive.userFeatures.feature1') }}</li>
                            <li>{{ t('discoverArchive.userFeatures.feature2') }}</li>
                            <li>{{ t('discoverArchive.userFeatures.feature3') }}</li>
                        </ul>
                    </div>

                    <div class="screenshot-section">
                        <h2 class="section-title">{{ t('discoverArchive.screenshot.title') }}</h2>
                        <p class="section-text">
                            {{ t('discoverArchive.screenshot.description') }}
                        </p>
                        <div class="screenshot-container">
                            <img 
                                src="/src/assets/images/other/bm-goodreads.png" 
                                :alt="t('discoverArchive.screenshot.alt')" 
                                class="screenshot-image"
                            />
                            <p class="screenshot-caption">
                                {{ t('discoverArchive.screenshot.caption') }}
                            </p>
                        </div>
                    </div>

                    <div class="impact-section">
                        <h2 class="section-title">{{ t('discoverArchive.impact.title') }}</h2>
                        <p class="section-text">
                            {{ t('discoverArchive.impact.intro') }}
                        </p>
                        <ul class="feature-list">
                            <li><strong>{{ t('discoverArchive.impact.point1') }}</strong> {{ t('discoverArchive.impact.point1Detail') }}</li>
                            <li><strong>{{ t('discoverArchive.impact.point2') }}</strong> {{ t('discoverArchive.impact.point2Detail') }}</li>
                            <li><strong>{{ t('discoverArchive.impact.point3') }}</strong> {{ t('discoverArchive.impact.point3Detail') }}</li>
                            <li><strong>{{ t('discoverArchive.impact.point4') }}</strong> {{ t('discoverArchive.impact.point4Detail') }}</li>
                            <li><strong>{{ t('discoverArchive.impact.point5') }}</strong> {{ t('discoverArchive.impact.point5Detail') }}</li>
                        </ul>
                    </div>

                    <div class="footer-note">
                        <p class="note-text">
                            {{ t('discoverArchive.footer') }}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>

<script>
import { useI18n } from 'vue-i18n'
import DashboardTopNavigation from '@/components/navigation/DashboardTopNavigation.vue'

export default {
    name: 'DiscoverView',
    setup() {
        const { t } = useI18n()
        return { t }
    },
    components: {
        DashboardTopNavigation
    }
}
</script>

<style scoped>
.discover-archive-container {
    width: 100%;
    padding: 2rem 0;
    display: flex;
    justify-content: center;
}

.discover-archive-content {
    max-width: 1200px;
    width: 100%;
    padding: 2.5rem;
    background-color: var(--secondary-bg-color);
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.archive-title {
    font-size: 2.5rem;
    font-weight: 600;
    color: var(--primary-text-color);
    margin-bottom: 2rem;
    text-align: center;
    letter-spacing: -0.5px;
}

.archive-intro {
    margin-bottom: 2.5rem;
}

.intro-text {
    font-size: 1.15rem;
    line-height: 1.8;
    color: var(--primary-text-color);
    opacity: 0.95;
}

.technical-section,
.feature-section,
.screenshot-section,
.impact-section {
    margin-bottom: 2.5rem;
}

.section-title {
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--primary-text-color);
    margin-bottom: 1.25rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.section-text {
    font-size: 1.05rem;
    line-height: 1.8;
    color: var(--primary-text-color);
    opacity: 0.9;
    margin-bottom: 1rem;
}

.highlight-box {
    background-color: rgba(255, 255, 255, 0.05);
    padding: 1.5rem;
    border-left: 4px solid #4a9eff;
    border-radius: 4px;
    margin: 1.5rem 0;
}

.highlight-box strong {
    color: #4a9eff;
    font-weight: 600;
}

.feature-list {
    list-style: none;
    padding-left: 0;
    margin: 1.25rem 0;
}

.feature-list li {
    font-size: 1.05rem;
    line-height: 1.8;
    color: var(--primary-text-color);
    opacity: 0.9;
    padding: 0.75rem 0 0.75rem 2rem;
    position: relative;
}

.feature-list li::before {
    content: "▸";
    position: absolute;
    left: 0.5rem;
    color: #4a9eff;
    font-weight: bold;
    font-size: 1.2rem;
}

.screenshot-section {
    margin: 3rem 0;
}

.screenshot-container {
    margin-top: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.screenshot-image {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.screenshot-caption {
    margin-top: 1rem;
    font-size: 0.95rem;
    color: var(--primary-text-color);
    opacity: 0.7;
    font-style: italic;
    text-align: center;
}

.impact-section .feature-list li strong {
    color: #4a9eff;
}

.footer-note {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.note-text {
    font-size: 1rem;
    line-height: 1.8;
    color: var(--primary-text-color);
    opacity: 0.8;
    font-style: italic;
    text-align: center;
}

@media (max-width: 768px) {
    .discover-archive-container {
        padding: 1rem;
    }

    .discover-archive-content {
        padding: 1.5rem;
    }

    .archive-title {
        font-size: 2rem;
    }

    .section-title {
        font-size: 1.5rem;
    }

    .intro-text,
    .section-text,
    .feature-list li {
        font-size: 1rem;
    }

    .feature-list li {
        padding-left: 1.5rem;
    }
}
</style>