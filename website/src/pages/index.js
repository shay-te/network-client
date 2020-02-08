import React from 'react';
import classnames from 'classnames';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

const features = [
  {
    title: <>Small Footprint</>,
    imageUrl: 'img/undraw_Playful_cat_rchv.svg',
    description: (
      <>
        Weight only 14KB
      </>
    ),
  },
  {
    title: <>Declarative</>,
    imageUrl: 'img/undraw_to_do_list_a49b.svg',
    description: (
      <>
        Define network calls upfront and call them as API method
      </>
    ),
  },
  {
    title: <>Plug-able</>,
    imageUrl: 'img/undraw_monitor_iqpq.svg',
    description: (
      <>
        Separate your network capabilities into modules
      </>
    ),
  },
];

function Feature({imageUrl, title, description}) {
  const imgUrl = useBaseUrl(imageUrl);
  return (
    <div className={classnames('col col--4', styles.feature)}>
      {imgUrl && (
        <div className="text--center">
          <img className={styles.featureImage} src={imgUrl} alt={title} />
        </div>
      )}
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function Home() {
  const context = useDocusaurusContext();
  const {siteConfig = {}} = context;
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />">
      <header className={classnames('hero hero--primary', styles.heroBanner)}>
        <div className="container">
          <h1 className="hero__title">{siteConfig.title}</h1>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
          <div className={styles.buttons}>
            <Link
              className={classnames(
                'button button--outline button--secondary button--lg',
                styles.getStarted,
              )}
              to={useBaseUrl('docs/main')}>
              Get Started
            </Link>

            <span className={styles['index-ctas-github-button']}>
              <iframe
                src="https://ghbtns.com/github-btn.html?user=shacoshe&amp;repo=network-client&amp;type=star&amp;count=false&amp;size=large"
                frameBorder={0}
                scrolling={0}
                width={160}
                height={30}
                style={{marginLeft: '10px', marginTop: '5px'}}
                title="GitHub Stars"
              />
            </span>


          </div>
        </div>
      </header>
      <main>
        {features && features.length && (
          <section className={styles.features}>
            <div className="container">
              <div className="row">
                {features.map((props, idx) => (
                  <Feature key={idx} {...props} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </Layout>
  );
}

export default Home;
